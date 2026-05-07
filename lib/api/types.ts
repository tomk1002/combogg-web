import type { Difficulty } from "@/types";

export interface AuthorDTO {
  id: string;
  nickname: string;
  avatarUrl: string | null;
  riotGameName: string | null;
  riotTagLine: string | null;
}

export interface GameDTO {
  slug: string;
  name: string;
}

export interface CharacterDTO {
  slug: string;
  name: string;
  iconUrl: string | null;
}

export interface InputEntryDTO {
  category: string;
  ref?: string;
  slot?: number | string;
}

export interface ComboListItemDTO {
  id: string;
  title: string;
  author: AuthorDTO;
  game: GameDTO;
  character: CharacterDTO;
  difficulty: Difficulty;
  tags: string[];
  durationMs: number | null;
  inputSummary: InputEntryDTO[];
  thumbnailUrl: string | null;
  videoUrl: string | null;
  likeCount: number;
  downloadCount: number;
  viewCount: number;
  patchVersion: string | null;
  createdAt: string;
}

export interface VideoCropDTO {
  x: number;
  y: number;
  w: number;
  h: number;
  ratio?: string;
}

export interface VideoTrimDTO {
  start: number;
  end: number;
}

export interface ComboDetailDTO extends ComboListItemDTO {
  description: string | null;
  tip: string | null;
  gameSpecific: Record<string, unknown>;
  videoUrl: string | null;
  videoCrop: VideoCropDTO | null;
  videoTrim: VideoTrimDTO | null;
  tutfileUrl: string | null;
  isLiked: boolean;
}

export interface UserProfileDTO {
  id: string;
  nickname: string;
  avatarUrl: string | null;
  createdAt: string;
  comboCount: number;
}

export interface CommentDTO {
  id: string;
  content: string;
  author: AuthorDTO;
  createdAt: string;
}

export interface PaginatedDTO<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

export type NotificationTypeDTO = "like" | "save" | "comment" | "share";

export interface NotificationDTO {
  id: string;
  type: NotificationTypeDTO;
  actor: { id: string; nickname: string | null; avatarUrl: string | null };
  combo: { id: string; title: string };
  commentId: string | null;
  readAt: string | null;
  createdAt: string;
}

export interface NotificationListDTO {
  items: NotificationDTO[];
  unreadCount: number;
  page: number;
  limit: number;
}
