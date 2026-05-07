-- 사용자 삭제 시 작성한 콤보가 함께 삭제되도록 FK 제약조건을 CASCADE로 변경.
-- (다른 관계들은 init/이후 마이그레이션에서 이미 CASCADE 또는 SetNull 으로 설정되어 있음.)

ALTER TABLE "combos" DROP CONSTRAINT "combos_authorId_fkey";
ALTER TABLE "combos" ADD CONSTRAINT "combos_authorId_fkey"
  FOREIGN KEY ("authorId") REFERENCES "users"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
