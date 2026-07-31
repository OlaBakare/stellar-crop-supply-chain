# Fuzz targets for the Crop Supply Chain contract

This directory is reserved for fuzz testing using `cargo-fuzz`.

To add a fuzz target:

1. Install cargo-fuzz: `cargo install cargo-fuzz`
2. Run `cargo fuzz add <target_name>` to create a new target
3. Implement the fuzz logic in `fuzz_targets/<target_name>.rs`

Example fuzz target structure:

```rust
#![no_coverage]
fuzz_target!(|data: &[u8]| {
    // Your fuzz logic here
});
```
