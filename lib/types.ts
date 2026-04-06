export type ProjectImage = {
  id: string;
  url: string;
  filename: string;
  mimeType: string;
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
};

export type NewImageInput = {
  filename: string;
  mimeType: string;
  dataBase64: string;
};

export type ProjectImageInput = ExistingImageInput | NewImageInput;

export type ProjectUpsertPayload = {
  name: string;
  description: string;
  createdAt?: string;
  images: ProjectImageInput[];
};