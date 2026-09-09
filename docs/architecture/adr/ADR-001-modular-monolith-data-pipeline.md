# ADR-001: Áp Dụng Mô Hình Modular Monolith & Tách Rời Data Pipeline

> **Trạng thái**: Đã phê duyệt (Approved)  
> **Thời điểm**: 2026-09-09  
> **Người đề xuất**: Antigravity AI & Maintainer

---

## 1. Bối Cảnh (Context)
Repository `Dyu20705/TypeWords` là bản fork Việt hóa từ `zyronon/TypeWords`. Trong quá trình phát triển branch `feat/vi-en-localization`, codebase phát triển đồng thời ba hướng:
1. Thêm tính năng luyện tập mới (feature branch);
2. Nâng cấp hiện đại hóa framework Nuxt 4 (modernization);
3. Bản địa hóa giao diện và dịch thuật 194 bộ từ điển (localization).

Các script xử lý dữ liệu từ vựng (`scripts/vocabulary/`) đang tạo và sửa đổi trực tiếp các tệp trong thư mục runtime `public/dicts/`, đồng thời lưu trữ các tệp cache và báo cáo khổng lồ ngay trong mã nguồn. Nếu không phân định ranh giới rõ ràng, technical debt sẽ tăng nhanh và cản trở việc bảo trì lâu dài.

---

## 2. Quyết Định Kiến Trúc (Decision)
1. Không biến repository thành monorepo đa gói phức tạp (Nx/Turborepo/Lerna) vì quy mô sản phẩm là một ứng dụng client-side SPA/SSG.
2. Chọn kiến trúc **Modular Monolith kết hợp phân tách hoàn toàn Data Pipeline**:
   - **Ứng dụng Nuxt (`app/`)**: Chỉ chịu trách nhiệm về giao diện, bàn gõ, âm thanh, điều hướng và lưu trữ cục bộ.
   - **Tầng Kỹ nghệ Dữ liệu (`data/` & `scripts/vocabulary/`)**: Chịu trách nhiệm về vòng đời dữ liệu: Thu thập (`sources`) $\to$ Chuẩn hóa (`normalized`) $\to$ Dịch thuật có kiểm soát (`localized`) $\to$ Kiểm định 3 tầng Quality Gates $\to$ Đóng gói xuất bản sang `public/dicts/` qua Staging.
3. Ứng dụng Nuxt coi `public/` là tài nguyên tĩnh chỉ đọc (**Read-Only Published Artifacts**), không chứa logic tải hay dịch thuật trong runtime.

---

## 3. Hệ Quả (Consequences)
* **Tích cực**:
  - Dễ bảo trì, phân định rõ trách nhiệm giữa kỹ nghệ dữ liệu và lập trình ứng dụng web.
  - Tái tạo dữ liệu (reproducible pipeline) 100% độc lập mà không làm hỏng ứng dụng đang chạy.
  - Kiểm soát được chất lượng bản dịch thông qua các cổng kiểm định tự động (Quality Gates).
* **Tiêu cực**:
  - Phải quản lý thêm quy trình staged publish trước khi dữ liệu từ vựng mới có hiệu lực trên giao diện.
