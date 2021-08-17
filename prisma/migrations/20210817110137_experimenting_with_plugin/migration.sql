-- CreateTable
CREATE TABLE "Foo" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Bar" (
    "id" TEXT NOT NULL,
    "fooId" TEXT NOT NULL,
    "text" TEXT NOT NULL,

    PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Bar" ADD FOREIGN KEY ("fooId") REFERENCES "Foo"("id") ON DELETE CASCADE ON UPDATE CASCADE;
