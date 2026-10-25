import fs from 'node:fs';
const migration='supabase/migrations/20261025122430_amazon_ads_import_core.sql';
const base=fs.readFileSync(migration,'utf8').split('-- App integration for amazon_ads.')[0].replace(/\ncommit;\s*$/,'\n');
fs.writeFileSync(migration,base+fs.readFileSync('supabase/ads_import_api.sql','utf8').replace(/\nbegin;\r?\n/,'\n'));
