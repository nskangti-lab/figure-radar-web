import Link from "next/link";

export default function NotFound() {
  return (
    <div className="rounded-lg border border-line bg-white p-8 text-center">
      <h1 className="text-2xl font-black text-ink">페이지를 찾을 수 없습니다.</h1>
      <p className="mt-2 text-sm text-neutral-600">
        상품이 삭제되었거나 아직 등록되지 않았을 수 있습니다.
      </p>
      <Link
        href="/search"
        className="mt-5 inline-flex h-10 items-center justify-center rounded-md bg-ink px-4 text-sm font-semibold text-white hover:bg-coral"
      >
        검색으로 이동
      </Link>
    </div>
  );
}
