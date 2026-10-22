export interface AllureLabel {
  name: string;
  value: string;
}

export interface AllureParameter {
  name: string;
  value?: string | null;
  excluded?: boolean;
  exclude?: boolean;
  mode?: string | null;
}

export interface AllureStatusDetails {
  message?: string | null;
  trace?: string | null;
}

export interface AllureAttachment {
  name: string;
  source: string;
  type?: string | null;
}

export interface AllureLink {
  name?: string | null;
  url?: string | null;
  type?: string | null;
}

export interface AllureStep {
  name: string;
  uuid?: string | null;

  status?: string | null;
  stage?: string | null;

  start?: number | null;
  stop?: number | null;

  statusDetails?: AllureStatusDetails | null;

  parameters?: AllureParameter[] | null;

  attachments?: AllureAttachment[] | null;

  steps?: AllureStep[] | null;
}

export interface AllureResult {
  uuid: string;

  historyId?: string | null;
  testCaseId?: string | null;

  name: string;
  fullName?: string | null;

  status?: string | null;
  stage?: string | null;

  start?: number | null;
  stop?: number | null;

  statusDetails?: AllureStatusDetails | null;

  labels?: AllureLabel[] | null;

  parameters?: AllureParameter[] | null;

  steps?: AllureStep[] | null;

  attachments?: AllureAttachment[] | null;

  links?: AllureLink[] | null;

  titlePath?: string[] | null;
}
