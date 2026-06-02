CREATE TYPE "CommentInteraction" AS ENUM ('APROBADO', 'DESAPROBADO', 'DUDA');

ALTER TABLE "comments" ADD COLUMN "interaction" "CommentInteraction" NOT NULL DEFAULT 'DUDA';

ALTER TABLE "comments" ALTER COLUMN "interaction" DROP DEFAULT;
