export type ProjectImage = {
  id: string;
  url: string;
  filename: string;
  mimeType: string;
  isFront?: boolean;
};

export type ProjectRecord = {
  id: string;
  name: string;
  description: string;
  images: ProjectImage[];
  imageCount: number;
  createdAt: string;
  updatedAt: string;
};

export type ExistingImageInput = {
  id: string;
  filename: string;
  mimeType: string;
  isFront?: boolean;
};

export type NewImageInput = {
  filename: string;
  mimeType: string;
  dataBase64: string;
  isFront?: boolean;
};

export type ProjectImageInput = ExistingImageInput | NewImageInput;

export type ProjectUpsertPayload = {
  name: string;
  description: string;
  createdAt?: string;
  images: ProjectImageInput[];
};

export type ContactSubmission = {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  projectType: string | null;
  message: string;
  createdAt: string;
};

export type SubmissionsResponse = {
  submissions: ContactSubmission[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export type HiringCandidate = {
  id: string;
  fullName: string;
  email: string;
  phone?: string | null;
  createdAt: string;
};

export type ProjectsResponse = {
  projects: ProjectRecord[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};