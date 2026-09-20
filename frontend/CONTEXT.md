# Nexus Inventory Frontend

คำศัพท์โดเมนที่ frontend ใช้เพื่อแสดงและจัดการข้อมูล inventory ตาม shared contract โดย backend และ PostgreSQL ยังคงเป็นแหล่งข้อมูลจริง

## Language

**Tenant**:
เจ้าของขอบเขตข้อมูลสินค้า โดย Product แต่ละรายการต้องสังกัด Tenant หนึ่งราย
_Avoid_: Store, Account

**Product**:
สินค้าคงคลังที่ระบุด้วย SKU ภายใน Tenant และมีราคาและ Actual Stock
_Avoid_: Item

**Reservation**:
บันทึกจำนวน Product ที่ถูกจอง พร้อมสถานะ RESERVED, COMMITTED หรือ RELEASED โดย V1 ยังไม่รับประกันความปลอดภัยจาก concurrent access
_Avoid_: Order, Guaranteed Reservation

**Actual Stock**:
จำนวนสินค้าคงคลังที่บันทึกอยู่ใน Product ไม่ใช่จำนวนสินค้าที่คำนวณว่าพร้อมขายหลังหัก Reservation
ในป้ายกำกับ UI สามารถใช้คำสั้นว่า **Stock** เมื่อบริบทชัดเจนตาม shared contract
_Avoid_: Available Stock
