"use client";

import { Terminal } from "@/components/terminal/Terminal";
import type { AppId } from "./registry";
import {
  AboutApp,
  ProjectsApp,
  StackApp,
  SocialApp,
  ResumeApp,
} from "./apps/content-apps";
import { NotepadApp, TodoApp, TaskManagerApp } from "./apps/utility-apps";
import { GamesApp } from "./apps/GamesApp";
import { GuestbookApp } from "./apps/GuestbookApp";
import { EncryptApp } from "./apps/EncryptApp";
import { SendApp } from "./apps/SendApp";
import { DecryptApp } from "./apps/DecryptApp";
import { SysInfoApp } from "./apps/SysInfoApp";
import { CloudApp } from "./apps/CloudApp";

export type AppComponentProps = { onOpenApp: (id: AppId) => void };

function TerminalApp({ onOpenApp }: AppComponentProps) {
  return (
    <div className="terminal-host h-full bg-bg">
      <Terminal embedded onOpenApp={(id) => onOpenApp(id as AppId)} />
    </div>
  );
}

export const appComponents: Record<AppId, React.ComponentType<AppComponentProps>> = {
  about: AboutApp,
  sysinfo: SysInfoApp,
  projects: ProjectsApp,
  stack: StackApp,
  social: SocialApp,
  resume: ResumeApp,
  games: GamesApp,
  notepad: NotepadApp,
  todo: TodoApp,
  taskmanager: TaskManagerApp,
  guestbook: GuestbookApp,
  cloud: CloudApp,
  encrypt: EncryptApp,
  send: SendApp,
  decrypt: DecryptApp,
  terminal: TerminalApp,
};
