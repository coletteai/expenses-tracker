CREATE TABLE document (
  id          INTEGER PRIMARY KEY CHECK (id = 1),
  version     INTEGER NOT NULL,
  data        TEXT    NOT NULL,
  updated_at  TEXT    NOT NULL,
  updated_by  TEXT    NOT NULL
);

CREATE TABLE snapshot (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  version     INTEGER NOT NULL,
  data        TEXT    NOT NULL,
  updated_by  TEXT    NOT NULL,
  created_at  TEXT    NOT NULL
);
