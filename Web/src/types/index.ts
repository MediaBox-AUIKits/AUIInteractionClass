export * from '@/components/ClassRoom/types';
export * from '@/components/Login/types';
export * from './permission';

export interface BasicMap<U> {
  [index: string]: U;
}

export enum IdentityForServer {
  Student = 1,
  Assistant,
  Teacher,
}
