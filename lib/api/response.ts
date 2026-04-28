import { NextResponse } from "next/server";

export function ok<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

export function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

export function unauthorized(message = "로그인이 필요합니다") {
  return NextResponse.json({ error: message }, { status: 401 });
}

export function forbidden(message = "권한이 없습니다") {
  return NextResponse.json({ error: message }, { status: 403 });
}

export function notFound(message = "찾을 수 없습니다") {
  return NextResponse.json({ error: message }, { status: 404 });
}

export function serverError(err: unknown) {
  console.error(err);
  return NextResponse.json({ error: "서버 오류가 발생했습니다" }, { status: 500 });
}
