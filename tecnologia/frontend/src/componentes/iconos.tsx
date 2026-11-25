import type { SVGProps } from 'react';
import {
  ArrowLeft, ArrowRight, BadgeCheck, Bell, CalendarCheck, CalendarDays, CalendarRange, CalendarX, Check, ChevronRight,
  CircleCheck, CircleCheckBig, ClipboardCheck, ClipboardList, ExternalLink, Eye, FilePlus, FileText, FolderOpen, History,
  IdCard, Inbox, Landmark, Lock, LogOut, Mail, MapPin, Menu, Pointer, Receipt, SquarePen, Upload, UserPlus, Users,
  Wallet, House, Bot, MessageCircleQuestionMark, Send, ShieldCheck, BookOpen, Undo2, ListTodo, TriangleAlert, type LucideIcon,
} from 'lucide-react';

type Svg = (p: SVGProps<SVGSVGElement>) => React.JSX.Element;
const base = { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' } as const;

/** Moto (II-B) y mototaxi (II-C): no existen en la librería, se dibujan con el mismo trazo. */
const Moto: Svg = (p) => (
  <svg {...base} {...p}><circle cx="5.5" cy="16.5" r="3.5" /><circle cx="18.5" cy="16.5" r="3.5" /><path d="M5.5 16.5 9 11h5l4.5 5.5" /><path d="M14 11l-1.5-4.5H10" /><path d="M15.5 6.5h2l1 3" /></svg>
);
const Mototaxi: Svg = (p) => (
  <svg {...base} {...p}><path d="M3 15V8a3 3 0 0 1 3-3h7l3 5h3a2 2 0 0 1 2 2v3" /><path d="M3 10h10" /><circle cx="7" cy="17" r="2.5" /><circle cx="18" cy="17" r="2.5" /><path d="M9.5 17h6" /></svg>
);

/** Solo se empaquetan los íconos de esta lista (antes: fuente completa de 4.5 MB). */
export const ICONOS: Record<string, LucideIcon | Svg> = {
  account_balance: Landmark, home: House, description: FileText, payments: Wallet, event: CalendarDays,
  fact_check: ClipboardCheck, notifications: Bell, inbox: Inbox, quiz: ClipboardList, verified: BadgeCheck,
  badge: IdCard, history: History, group: Users, calendar_month: CalendarRange, logout: LogOut, menu: Menu,
  visibility: Eye, upload: Upload, person_add: UserPlus, open_in_new: ExternalLink, mail: Mail, lock: Lock,
  location_on: MapPin, event_available: CalendarCheck, event_busy: CalendarX, edit_note: SquarePen,
  chevron_right: ChevronRight, check_circle: CircleCheck, check: Check, arrow_forward: ArrowRight,
  arrow_back: ArrowLeft, touch_app: Pointer, task_alt: CircleCheckBig, receipt_long: Receipt,
  folder_open: FolderOpen, assignment_add: FilePlus, two_wheeler: Moto, electric_rickshaw: Mototaxi,
  smart_toy: Bot, forum: MessageCircleQuestionMark, send: Send, shield: ShieldCheck, menu_book: BookOpen, undo: Undo2, pendientes: ListTodo, alerta: TriangleAlert,
};
