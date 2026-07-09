"use client"
import React, {
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  useMutation,
  useQuery,
} from 'convex/react';
import {
  Crown,
  FileText,
  FolderOpen,
  LoaderCircle,
  NotebookPen,
  Pencil,
  Search,
  Trash2,
  Zap,
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { api } from '@/convex/_generated/api';
import { useUser } from '@clerk/nextjs';

import UploadPdfDialog from './_components/UploadPdfDialog';

function StatCard({ icon: Icon, label, value, accent }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border bg-card p-4 shadow-xs">
      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${accent}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-lg font-bold leading-tight">{value}</p>
      </div>
    </div>
  );
}

function FileCard({ file, onRename, onDelete }) {
  const created = new Date(file._creationTime).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <div className="group relative rounded-2xl border bg-card p-5 shadow-xs transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md">
      <Link href={'/workspace/' + file.fileId} className="block">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-red-500/15 to-orange-500/15">
          <FileText className="h-5 w-5 text-red-500" />
        </div>
        <h2 className="mt-3 truncate font-semibold" title={file.fileName}>
          {file.fileName}
        </h2>
        <p className="mt-0.5 text-xs text-muted-foreground">{created}</p>
      </Link>

      <div className="absolute top-3 right-3 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        <button
          title="Rename"
          onClick={(e) => {
            e.preventDefault();
            onRename(file);
          }}
          className="rounded-md bg-background/80 p-1.5 text-muted-foreground shadow-xs backdrop-blur transition-colors hover:text-primary"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
        <button
          title="Delete"
          onClick={(e) => {
            e.preventDefault();
            onDelete(file);
          }}
          className="rounded-md bg-background/80 p-1.5 text-muted-foreground shadow-xs backdrop-blur transition-colors hover:text-destructive"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

function Dashboard() {
  const { user } = useUser();
  const email = user?.primaryEmailAddress?.emailAddress;

  const createUser = useMutation(api.user.createUser);
  const renameFile = useMutation(api.fileStorage.RenameFile);
  const deleteFile = useMutation(api.fileStorage.DeleteFile);

  const fileList = useQuery(api.fileStorage.GetUserFiles, { userEmail: email });
  const userInfo = useQuery(api.user.GetUserInfo, { userEmail: email });
  const notesCount = useQuery(api.notes.CountUserNotes, { userEmail: email });

  const [search, setSearch] = useState('');
  const [renameTarget, setRenameTarget] = useState(null);
  const [newName, setNewName] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Ensure the user exists in our DB
  useEffect(() => {
    if (email) {
      createUser({
        email,
        imageUrl: user?.imageUrl ?? '',
        userName: user?.fullName ?? email.split('@')[0],
      });
    }
  }, [email]);

  const filteredFiles = useMemo(() => {
    if (!fileList) return fileList;
    const q = search.trim().toLowerCase();
    if (!q) return fileList;
    return fileList.filter((f) => f.fileName.toLowerCase().includes(q));
  }, [fileList, search]);

  const isMaxFile = (fileList?.length ?? 0) >= 5 && !userInfo?.upgrade;
  const loading = fileList === undefined;

  const submitRename = async () => {
    if (!newName.trim()) return toast.error('Enter a new name');
    try {
      await renameFile({ fileId: renameTarget.fileId, newName });
      toast.success('File renamed');
      setRenameTarget(null);
    } catch (error) {
      toast.error(error.message);
    }
  };

  const submitDelete = async () => {
    setDeleting(true);
    try {
      await deleteFile({ fileId: deleteTarget.fileId });
      toast.success(`"${deleteTarget.fileName}" deleted`);
      setDeleteTarget(null);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      {/* Heading row */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            Hey {user?.firstName ?? 'there'} 👋
          </h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Upload a PDF, then chat with it and take AI-powered notes.
          </p>
        </div>
        <div className="w-full sm:w-auto sm:min-w-44">
          <UploadPdfDialog isMaxFile={isMaxFile} />
        </div>
      </div>

      {/* Stats */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          icon={FolderOpen}
          label="PDFs uploaded"
          value={
            userInfo?.upgrade
              ? fileList?.length ?? '—'
              : `${fileList?.length ?? '—'} / 5`
          }
          accent="bg-indigo-500/15 text-indigo-500"
        />
        <StatCard
          icon={NotebookPen}
          label="Notes taken"
          value={notesCount ?? '—'}
          accent="bg-violet-500/15 text-violet-500"
        />
        <StatCard
          icon={userInfo?.upgrade ? Crown : Zap}
          label="Current plan"
          value={userInfo?.upgrade ? 'Unlimited' : 'Free'}
          accent="bg-amber-500/15 text-amber-500"
        />
      </div>

      {/* Search */}
      <div className="relative mt-8 max-w-sm">
        <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search your PDFs…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Files */}
      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {loading ? (
          [1, 2, 3, 4].map((item) => (
            <div key={item} className="h-36 animate-pulse rounded-2xl bg-muted" />
          ))
        ) : filteredFiles?.length > 0 ? (
          filteredFiles.map((file) => (
            <FileCard
              key={file.fileId}
              file={file}
              onRename={(f) => {
                setRenameTarget(f);
                setNewName(f.fileName);
              }}
              onDelete={setDeleteTarget}
            />
          ))
        ) : (
          <div className="col-span-full flex flex-col items-center justify-center rounded-2xl border border-dashed py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
              <FileText className="h-7 w-7 text-muted-foreground" />
            </div>
            <h3 className="mt-4 font-semibold">
              {search ? 'No PDFs match your search' : 'No PDFs yet'}
            </h3>
            <p className="mt-1 max-w-xs text-sm text-muted-foreground">
              {search
                ? 'Try a different keyword.'
                : 'Upload your first PDF to start chatting with it and taking notes.'}
            </p>
            {!search && (
              <div className="mt-5 w-44">
                <UploadPdfDialog isMaxFile={isMaxFile} />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Rename dialog */}
      <Dialog open={!!renameTarget} onOpenChange={(v) => !v && setRenameTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename PDF</DialogTitle>
            <DialogDescription>Give “{renameTarget?.fileName}” a new name.</DialogDescription>
          </DialogHeader>
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submitRename()}
            placeholder="New file name"
            autoFocus
          />
          <DialogFooter>
            <DialogClose render={<Button variant="ghost">Cancel</Button>} />
            <Button onClick={submitRename}>Rename</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(v) => !v && !deleting && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete “{deleteTarget?.fileName}”?</DialogTitle>
            <DialogDescription>
              This permanently removes the PDF, its notes, chat history, and AI
              index. This can’t be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="ghost" disabled={deleting}>Cancel</Button>} />
            <Button variant="destructive" onClick={submitDelete} disabled={deleting}>
              {deleting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default Dashboard;
