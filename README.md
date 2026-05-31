# figure-radar-web

피규어레이더 MVP입니다. 피규어 상품을 작품, 캐릭터, 제조사, Product Group, Product Variant, Shop Listing 구조로 관리하고 사용자를 외부 판매처로 연결합니다.

직접 결제, 장바구니, 자체 판매 기능은 포함하지 않습니다.

## 실행

```bash
npm install
npm run dev
```

개발 서버는 기본적으로 `http://localhost:3000`에서 실행됩니다.

## 환경변수

`.env.local`에 아래 값을 설정하세요. 이 파일은 Git에 포함하지 않습니다.

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ADMIN_PASSWORD=
```

- 사용자 화면은 anon key로 조회합니다.
- 관리자 CRUD, Bulk Add, Quick Add, click log 기록처럼 서버 권한이 필요한 작업은 서버에서만 service role key를 사용합니다.
- `/admin`은 `ADMIN_PASSWORD`로 보호됩니다. 비밀번호가 맞으면 `figure_radar_admin_auth` httpOnly cookie가 설정됩니다.
- 개발 환경에서 `ADMIN_PASSWORD`가 없으면 경고를 표시합니다. 운영 환경에서는 admin 접근이 차단됩니다.

## 주요 경로

- `/`: 검색창, 최신 등록 상품, 예약중 상품, 인기 작품
- `/search?q=`: 상품 검색과 MVP 필터
- `/products/[slug]`: 상품 상세, variant, 판매처 링크
- `/admin/login`: 관리자 로그인
- `/admin`: 관리자 대시보드
- `/admin/quick-add`: 상품 빠른 등록
- `/admin/bulk-add`: CSV 대량 등록
- `/admin/works`
- `/admin/characters`
- `/admin/manufacturers`
- `/admin/product-groups`
- `/admin/product-variants`
- `/admin/shop-listings`
- `/admin/review-queue`
