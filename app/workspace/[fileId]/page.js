"use client"
import React, { useState } from 'react';

import { useQuery } from 'convex/react';
import {
  FileSearch,
  FileText,
  MessagesSquare,
} from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { api } from '@/convex/_generated/api';

import ChatPanel from '../_components/ChatPanel';
import PdfViewer from '../_components/PdfViewer';
import TextEditor from '../_components/TextEditor';
import WorkspaceHeader from '../_components/WorkspaceHeader';

function TabButton({ active, onClick, icon: Icon, children }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
        active
          ? 'bg-background text-foreground shadow-sm'
          : 'text-muted-foreground hover:text-foreground'
      }`}
    >
      <Icon className="h-3.5 w-3.5" />
      {children}
    </button>
  );
}

function Workspace() {
  const { fileId } = useParams();
  const [rightTab, setRightTab] = useState('pdf');
  const [editor, setEditor] = useState(null);

  const fileInfo = useQuery(api.fileStorage.GetFileRecord, { fileId });

  // Query resolved but the file doesn't exist
  if (fileInfo === null) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4 px-6 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
          <FileSearch className="h-7 w-7 text-muted-foreground" />
        </div>
        <div>
          <h2 className="text-lg font-semibold">File not found</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            This PDF may have been deleted, or the link is wrong.
          </p>
        </div>
        <Link href="/dashboard">
          <Button>Back to dashboard</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <WorkspaceHeader fileName={fileInfo?.fileName} />

      <div className="grid flex-1 grid-cols-1 overflow-hidden lg:grid-cols-2">
        {/* Notes editor */}
        <div className="flex min-h-0 flex-col border-b lg:border-r lg:border-b-0">
          <TextEditor
            fileId={fileId}
            fileName={fileInfo?.fileName}
            onEditorReady={setEditor}
          />
        </div>

        {/* PDF / Chat */}
        <div className="flex min-h-0 flex-col">
          <div className="flex h-11 shrink-0 items-center gap-1 border-b bg-muted/60 px-3">
            <div className="flex gap-1 rounded-xl bg-muted p-1">
              <TabButton
                active={rightTab === 'pdf'}
                onClick={() => setRightTab('pdf')}
                icon={FileText}
              >
                PDF
              </TabButton>
              <TabButton
                active={rightTab === 'chat'}
                onClick={() => setRightTab('chat')}
                icon={MessagesSquare}
              >
                Chat with PDF
              </TabButton>
            </div>
          </div>

          {/* Keep both mounted so chat state survives tab switches */}
          <div className="min-h-0 flex-1">
            <div className={rightTab === 'pdf' ? 'h-full' : 'hidden'}>
              <PdfViewer fileUrl={fileInfo?.fileUrl} />
            </div>
            <div className={rightTab === 'chat' ? 'h-full' : 'hidden'}>
              <ChatPanel fileId={fileId} editor={editor} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Workspace;
