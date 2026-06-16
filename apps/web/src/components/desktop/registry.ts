/** App metadata only (no React components) so the Zustand store can import it
 *  without creating a circular dependency with the app components. */

export type AppId =
  | "about"
  | "projects"
  | "stack"
  | "social"
  | "resume"
  | "games"
  | "notepad"
  | "todo"
  | "taskmanager"
  | "guestbook"
  | "send"
  | "decrypt"
  | "terminal";

export type AppMeta = {
  id: AppId;
  title: string;
  icon: string; // emoji fallback
  img?: string; // snowman icon image
  w: number;
  h: number;
  /** show as an icon on the desktop surface */
  onDesktop?: boolean;
};

const ICON = "/boneco_neve";

export const appsMeta: Record<AppId, AppMeta> = {
  about: { id: "about", title: "Sobre Mim", icon: "👤", img: `${ICON}/about_me.png`, w: 560, h: 460, onDesktop: true },
  projects: { id: "projects", title: "Projetos", icon: "🗂️", img: `${ICON}/projects.png`, w: 720, h: 520, onDesktop: true },
  stack: { id: "stack", title: "Stack", icon: "🧩", img: `${ICON}/stack.png`, w: 560, h: 520, onDesktop: true },
  social: { id: "social", title: "Social", icon: "🌐", img: `${ICON}/social.png`, w: 460, h: 420, onDesktop: true },
  resume: { id: "resume", title: "Currículo", icon: "📄", img: `${ICON}/resume.png`, w: 640, h: 560, onDesktop: true },
  games: { id: "games", title: "Jogos", icon: "🎮", img: `${ICON}/games.png`, w: 520, h: 560, onDesktop: true },
  notepad: { id: "notepad", title: "Bloco de Notas", icon: "📝", img: `${ICON}/notepad.png`, w: 520, h: 460, onDesktop: true },
  todo: { id: "todo", title: "To-Do List", icon: "✅", img: `${ICON}/to_do_list.png`, w: 440, h: 520, onDesktop: true },
  taskmanager: { id: "taskmanager", title: "Gerenciador de Tarefas", icon: "📊", w: 560, h: 440 },
  guestbook: { id: "guestbook", title: "Livro de Visitas", icon: "📖", img: `${ICON}/guestbook.png`, w: 560, h: 560, onDesktop: true },
  send: { id: "send", title: "Enviar Arquivo", icon: "🔒", img: `${ICON}/send_file.png`, w: 560, h: 600, onDesktop: true },
  decrypt: { id: "decrypt", title: "Descriptografar", icon: "🔓", img: `${ICON}/decrypt.png`, w: 560, h: 600, onDesktop: true },
  terminal: { id: "terminal", title: "Terminal", icon: "🖥️", img: `${ICON}/terminal.png`, w: 680, h: 460, onDesktop: true },
};

export const desktopApps = Object.values(appsMeta).filter((a) => a.onDesktop);
