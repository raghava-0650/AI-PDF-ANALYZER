"use client"
import React, { useState } from 'react';

import {
  useAction,
  useMutation,
} from 'convex/react';
import {
  CloudUpload,
  FileUp,
  LoaderCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import uuid4 from 'uuid4';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { api } from '@/convex/_generated/api';
import { useUser } from '@clerk/nextjs';

const MAX_SIZE_MB = 20;

function UploadPdfDialog({ children, isMaxFile }) {
  const generateUploadUrl = useMutation(api.fileStorage.generateUploadUrl);
  const addFileEntry = useMutation(api.fileStorage.AddFileEntryToDb);
  const getFileUrl = useMutation(api.fileStorage.getFileUrl);
  const embedDocument = useAction(api.myAction.ingest);
  const { user } = useUser();

  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState('');
  const [step, setStep] = useState(''); // '', 'upload', 'parse', 'embed'
  const [open, setOpen] = useState(false);

  const loading = step !== '';

  const reset = () => {
    setFile(null);
    setFileName('');
    setStep('');
  };

  const onFileSelect = (event) => {
    const selected = event.target.files?.[0];
    if (!selected) return;

    if (selected.type !== 'application/pdf') {
      toast.error('Please select a PDF file');
      return;
    }
    if (selected.size > MAX_SIZE_MB * 1024 * 1024) {
      toast.error(`File is too large — max ${MAX_SIZE_MB}MB`);
      return;
    }

    setFile(selected);
    if (!fileName) setFileName(selected.name.replace(/\.pdf$/i, ''));
  };

  const onUpload = async () => {
    if (!file) return toast.error('Please select a PDF file');
    if (!fileName.trim()) return toast.error('Please enter a file name');

    try {
      // 1. Upload the PDF to Convex storage
      setStep('upload');
      const postUrl = await generateUploadUrl();
      const uploadResult = await fetch(postUrl, {
        method: 'POST',
        headers: { 'Content-Type': file.type },
        body: file,
      });
      if (!uploadResult.ok) throw new Error('Upload failed — please try again');
      const { storageId } = await uploadResult.json();

      const fileId = uuid4();
      const fileUrl = await getFileUrl({ storageId });

      await addFileEntry({
        fileId,
        storageId,
        fileName: fileName.trim(),
        fileUrl,
        createdBy: user?.primaryEmailAddress?.emailAddress,
      });

      // 2. Extract + split text
      setStep('parse');
      const apiResp = await fetch(
        '/api/pdf-loader?pdfUrl=' + encodeURIComponent(fileUrl)
      );
      const parsed = await apiResp.json();
      if (!apiResp.ok) throw new Error(parsed.error || 'Could not read the PDF');

      // 3. Embed into the vector index
      setStep('embed');
      await embedDocument({ splitText: parsed.result, fileId });

      toast.success(`"${fileName.trim()}" is ready — open it to start`);
      reset();
      setOpen(false);
    } catch (error) {
      console.error(error);
      toast.error(error.message || 'Something went wrong while processing the PDF');
      setStep('');
    }
  };

  const stepLabel = {
    upload: 'Uploading PDF…',
    parse: 'Extracting text…',
    embed: 'Indexing for AI search…',
  }[step];

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (loading) return; // don't close mid-processing
        setOpen(value);
        if (!value) reset();
      }}
    >
      <DialogTrigger
        render={
          children ?? (
            <Button disabled={isMaxFile} className="w-full" title={isMaxFile ? 'Free plan limit reached — upgrade to upload more' : undefined}>
              <CloudUpload className="h-4 w-4" /> Upload PDF
            </Button>
          )
        }
      />

      <DialogContent showCloseButton={!loading}>
        <DialogHeader>
          <DialogTitle>Upload a PDF</DialogTitle>
          <DialogDescription>
            Your PDF is parsed, chunked, and indexed so you can chat with it
            and take AI-assisted notes.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <label
            htmlFor="pdf-upload-input"
            className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-6 text-center transition-colors ${
              file
                ? 'border-primary/50 bg-primary/5'
                : 'border-border hover:border-primary/40 hover:bg-muted/50'
            }`}
          >
            <FileUp className={`h-7 w-7 ${file ? 'text-primary' : 'text-muted-foreground'}`} />
            {file ? (
              <div>
                <p className="text-sm font-medium">{file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(file.size / 1024 / 1024).toFixed(2)} MB — click to change
                </p>
              </div>
            ) : (
              <div>
                <p className="text-sm font-medium">Click to choose a PDF</p>
                <p className="text-xs text-muted-foreground">Up to {MAX_SIZE_MB}MB</p>
              </div>
            )}
            <input
              id="pdf-upload-input"
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={onFileSelect}
            />
          </label>

          <div className="space-y-1.5">
            <label className="text-sm font-medium" htmlFor="pdf-name-input">
              File name <span className="text-destructive">*</span>
            </label>
            <Input
              id="pdf-name-input"
              placeholder="e.g. Operating Systems — Unit 3"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              disabled={loading}
            />
          </div>
        </div>

        <DialogFooter className="sm:justify-between sm:items-center">
          <div className="text-xs text-muted-foreground">
            {loading && (
              <span className="flex items-center gap-1.5">
                <LoaderCircle className="h-3 w-3 animate-spin" /> {stepLabel}
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <DialogClose
              render={
                <Button type="button" variant="ghost" disabled={loading}>
                  Cancel
                </Button>
              }
            />
            <Button onClick={onUpload} disabled={loading || !file}>
              {loading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : 'Upload & process'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default UploadPdfDialog;
