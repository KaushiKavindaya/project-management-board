export interface IComment { id: number; text: string; card_id: number; user_id: number; email: string; created_at: string; }
export interface ICard { id: number; content: string; position: number; list_id: number; description?: string; due_date?: string; comments?: IComment[]; }
export interface IList { id: number; name: string; position: number; cards: ICard[]; }
export interface IBoard { id: number; name: string; lists: IList[]; }