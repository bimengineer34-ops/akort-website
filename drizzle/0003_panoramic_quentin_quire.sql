CREATE TABLE `page_views` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`path` text NOT NULL,
	`created_at` integer NOT NULL
);
