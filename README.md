# figure-radar-web

피규어레이더 웹 앱입니다. 피규어 상품을 작품, 캐릭터, 제조사, Product Group,
Product Variant, Shop Listing 구조로 관리하고 사용자를 외부 판매처로 연결합니다.
직접 결제, 장바구니, 자체 판매 기능은 포함하지 않습니다.

## 실행

```bash
npm install
npm run dev
```

개발 서버는 기본적으로 http://localhost:3000 에서 실행됩니다.

## 환경변수

`.env.local`에 아래 값을 설정하세요. 이 파일은 `.gitignore`에 의해 Git에 포함되지 않습니다.

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

- 사용자 화면은 anon key로 조회합니다.
- 관리자 CRUD와 클릭 로그 API는 서버에서만 service role key를 사용합니다.
- `/admin`은 MVP 관리 화면이며 별도 인증 레이어는 아직 포함되어 있지 않습니다.

## 주요 경로

- `/`: 검색창, 최신 등록 상품, 예약중 상품, 인기 작품
- `/search?q=`: 상품 검색 및 MVP 필터
- `/products/[slug]`: 상품 상세, variant, 판매처 링크
- `/admin`: 관리자 대시보드
- `/admin/works`
- `/admin/characters`
- `/admin/manufacturers`
- `/admin/product-groups`
- `/admin/product-variants`
- `/admin/shop-listings`
- `/admin/review-queue`
