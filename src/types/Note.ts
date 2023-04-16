/**
 * Custom type declaration representing a Notepad note.
 */
export type Note = {
  id: string;
  title: string;
  helperType: string;
  path: string;
  command?: string;
  newFile?: string;
  scriptFile?: string;
  scriptFileName?: string;
};


export type Helper = {
  id: string;
  title: string;
  helperType: string;
  path: string;
  command?: string;
  newFile?: string;
  scriptFile?: string;
};
