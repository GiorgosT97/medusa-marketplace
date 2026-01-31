import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260131112714 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "store_address" drop constraint if exists "store_address_store_id_unique";`);
    this.addSql(`create table if not exists "store_address" ("id" text not null, "store_id" text not null, "address_1" text not null, "address_2" text null, "city" text not null, "postal_code" text not null, "province" text null, "country_code" text not null, "phone" text null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "store_address_pkey" primary key ("id"));`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_store_address_store_id_unique" ON "store_address" ("store_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_store_address_deleted_at" ON "store_address" ("deleted_at") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "store_address" cascade;`);
  }

}
