# Domain Docs

ก่อนแก้ frontend ให้อ่าน:

- `CONTEXT.md` ถ้ามี
- ADR ที่เกี่ยวข้องภายใต้ `docs/adr/` ถ้ามี
- Shared contract ที่ `../docs/NEXUS_CRUD_SHARED_CONTRACT.md`

ใช้คำศัพท์และ JSON field ตาม shared contract และแจ้งให้ชัดเจนหากการเปลี่ยนแปลงขัดกับ ADR เดิม

โครงสร้างเป็น single-context:

```text
frontend/
├── CONTEXT.md
├── docs/agents/
├── docs/adr/
└── src/
```
