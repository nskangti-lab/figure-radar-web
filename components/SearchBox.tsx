import { Search } from "lucide-react";

type SearchBoxProps = {
  defaultValue?: string;
  compact?: boolean;
};

export function SearchBox({ defaultValue = "", compact = false }: SearchBoxProps) {
  return (
    <form
      action="/search"
      className={`flex w-full items-center gap-2 rounded-lg border border-line bg-white p-2 shadow-soft ${
        compact ? "" : "max-w-3xl"
      }`}
    >
      <label className="sr-only" htmlFor="global-search">
        상품 검색
      </label>
      <Search aria-hidden="true" className="ml-2 h-5 w-5 shrink-0 text-mint" />
      <input
        id="global-search"
        name="q"
        type="search"
        defaultValue={defaultValue}
        placeholder="작품, 캐릭터, 제조사, 상품명 검색"
        className="min-w-0 flex-1 bg-transparent px-2 py-2 text-base outline-none placeholder:text-neutral-400"
      />
      <button
        type="submit"
        className="inline-flex h-10 items-center justify-center rounded-md bg-ink px-4 text-sm font-semibold text-white transition hover:bg-coral"
      >
        검색
      </button>
    </form>
  );
}
