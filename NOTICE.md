# Vidyut Sandhi provenance

Vidyut is an Ambuda project. Copyright (c) 2022 ambuda.org. The port is
based on the `py-0.4.0` release at commit
`f3ba4167d40eebc4b3023d24e66867aa6a8cdb32`. This distribution preserves the
exact text of the upstream MIT license in `LICENSE`.
[Pinned license](https://github.com/ambuda-org/vidyut/blob/f3ba4167d40eebc4b3023d24e66867aa6a8cdb32/bindings-python/LICENSE.md) ·
[Upstream package license declaration](https://github.com/ambuda-org/vidyut/blob/f3ba4167d40eebc4b3023d24e66867aa6a8cdb32/Cargo.toml)

The JavaScript module adapts `Splitter::from_csv`, `Splitter::split_at`,
`Splitter::split_all`, `Split::is_valid`, and `Split::is_recursive`, along
with the SLP1 character classification used by the splitter. Its API
takes CSV text and returns plain records with boolean flags.
[Upstream splitter](https://github.com/ambuda-org/vidyut/blob/f3ba4167d40eebc4b3023d24e66867aa6a8cdb32/vidyut-sandhi/src/splitter.rs) ·
[Upstream sound classification](https://github.com/ambuda-org/vidyut/blob/f3ba4167d40eebc4b3023d24e66867aa6a8cdb32/vidyut-sandhi/src/sounds.rs)

`rules.csv` is the unmodified `sandhi/rules.csv` entry from the official
`data-0.4.0.zip` release asset (GitHub asset `222347064`). The rules are
encoded in Vidyut’s MIT-licensed `generator.rs` and serialized by
`create_sandhi_rules.rs`. The file contains a header and 1,468 rule rows
(13,966 bytes). Its SHA-256 is
`f691868cdf76da8c4034c690603a70929d0c18335306c6254f86347b208999a7`.
[Release asset](https://github.com/ambuda-org/vidyut/releases/download/py-0.4.0/data-0.4.0.zip) ·
[Rule generator](https://github.com/ambuda-org/vidyut/blob/f3ba4167d40eebc4b3023d24e66867aa6a8cdb32/vidyut-sandhi/src/generator.rs) ·
[CSV writer](https://github.com/ambuda-org/vidyut/blob/f3ba4167d40eebc4b3023d24e66867aa6a8cdb32/vidyut-data/src/bin/create_sandhi_rules.rs)

## JavaScript port notice

Copyright (c) 2026 Zeev Belkin

This notice applies to original JavaScript port contributions under the MIT
terms included in [LICENSE](LICENSE).
