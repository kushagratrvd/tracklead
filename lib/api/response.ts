import { NextResponse } from "next/server";

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export function apiSuccess<T>(
  data: T,
  meta?: PaginationMeta,
  status = 200
) {
  const body: { data: T; meta?: PaginationMeta } = { data };
  if (meta) {
    body.meta = meta;
  }
  return NextResponse.json(body, { status });
}

export function apiError(
  message: string,
  code: string,
  status = 400,
  details?: unknown
) {
  const body: { error: { message: string; code: string; details?: unknown } } = {
    error: {
      message,
      code,
      ...(details ? { details } : {}),
    },
  };
  return NextResponse.json(body, { status });
}
