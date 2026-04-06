-- ============================================================
-- DEFENCE EQUIPMENT ACCOUNTABILITY SYSTEM
-- Seed Data — Realistic demo data for all 16 tables
-- Run order: executes AFTER init.sql
-- ============================================================

-- ============================================================
-- BASES (3 military installations)
-- ============================================================
INSERT INTO bases (id, name, code, latitude, longitude, address) VALUES
  ('a1000000-0000-0000-0000-000000000001', 'Northern Command Headquarters', 'NCH-001', 32.72600000, 74.85700000, 'Udhampur, Jammu & Kashmir, India'),
  ('a1000000-0000-0000-0000-000000000002', 'Eastern Outpost Alpha',          'EOA-002', 27.33400000, 88.61700000, 'Gangtok, Sikkim, India'),
  ('a1000000-0000-0000-0000-000000000003', 'Western Desert Command',         'WDC-003', 26.91200000, 70.90600000, 'Jaisalmer, Rajasthan, India');

-- ============================================================
-- UNITS (3 per base = 9 units total)
-- ============================================================
INSERT INTO units (id, name, code, base_id, description) VALUES
  -- NCH-001 units
  ('b1000000-0000-0000-0000-000000000001', 'Alpha Company',     'NCH-ALPHA',   'a1000000-0000-0000-0000-000000000001', 'Primary assault company'),
  ('b1000000-0000-0000-0000-000000000002', 'Bravo Signals',     'NCH-BRAVO',   'a1000000-0000-0000-0000-000000000001', 'Communications and signals unit'),
  ('b1000000-0000-0000-0000-000000000003', 'Charlie Armory',    'NCH-CHARLIE', 'a1000000-0000-0000-0000-000000000001', 'Equipment storage and armory'),
  -- EOA-002 units
  ('b1000000-0000-0000-0000-000000000004', 'Delta Recon',       'EOA-DELTA',   'a1000000-0000-0000-0000-000000000002', 'Reconnaissance and surveillance'),
  ('b1000000-0000-0000-0000-000000000005', 'Echo Medical',      'EOA-ECHO',    'a1000000-0000-0000-0000-000000000002', 'Medical and CASEVAC unit'),
  ('b1000000-0000-0000-0000-000000000006', 'Foxtrot Engineers', 'EOA-FOXTROT', 'a1000000-0000-0000-0000-000000000002', 'Combat engineering unit'),
  -- WDC-003 units
  ('b1000000-0000-0000-0000-000000000007', 'Golf Armor',        'WDC-GOLF',    'a1000000-0000-0000-0000-000000000003', 'Armored vehicle division'),
  ('b1000000-0000-0000-0000-000000000008', 'Hotel Aviation',    'WDC-HOTEL',   'a1000000-0000-0000-0000-000000000003', 'Aerial support unit'),
  ('b1000000-0000-0000-0000-000000000009', 'India Intelligence','WDC-INDIA',   'a1000000-0000-0000-0000-000000000003', 'Intelligence and surveillance');

-- ============================================================
-- PERSONNEL (15 users covering all roles)
-- ============================================================
-- Password for ALL seed users: "Deas@2024!" → bcrypt hash below
-- $2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TiGniYE6RHiCVcmuAIIxAAAAAAAA
-- NOTE: regenerate with bcrypt.hashSync('Deas@2024!', 12) in real use

INSERT INTO personnel (id, service_number, full_name, email, phone, password_hash, role, rank, badge_number, unit_id, base_id, clearance_level, token_version) VALUES
  -- Super Admin
  ('c1000000-0000-0000-0000-000000000001',
   'IND-2024-0001', 'Gen. Arjun Mehta',     'arjun.mehta@deas.mil',     '+91-9800000001',
   '$2b$12$dn79bnTvzPsku72mQGjDFO917YjhPnqqjQZWFsVv9hx9u9Ze1oHka',
   'SUPER_ADMIN', 'General', 'ADM-0001', 'b1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 5, 1),

  -- Base Admins
  ('c1000000-0000-0000-0000-000000000002',
   'IND-2024-0002', 'Col. Priya Sharma',    'priya.sharma@deas.mil',    '+91-9800000002',
   '$2b$12$dn79bnTvzPsku72mQGjDFO917YjhPnqqjQZWFsVv9hx9u9Ze1oHka',
   'BASE_ADMIN', 'Colonel', 'ADM-0002', 'b1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 4, 1),
  ('c1000000-0000-0000-0000-000000000003',
   'IND-2024-0003', 'Col. Rajiv Nair',      'rajiv.nair@deas.mil',      '+91-9800000003',
   '$2b$12$dn79bnTvzPsku72mQGjDFO917YjhPnqqjQZWFsVv9hx9u9Ze1oHka',
   'BASE_ADMIN', 'Colonel', 'ADM-0003', 'b1000000-0000-0000-0000-000000000004', 'a1000000-0000-0000-0000-000000000002', 4, 1),

  -- OFFICERS (Demo Role: Officer)
  ('c1000000-0000-0000-0000-000000000004',
   'IND-2024-0004', 'Major Vikram Singh',   'vikram.singh@deas.mil',    '+91-9800000004',
   '$2b$12$dn79bnTvzPsku72mQGjDFO917YjhPnqqjQZWFsVv9hx9u9Ze1oHka',
   'OFFICER', 'Major', 'OFF-0091', 'b1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 3, 1),
  ('c1000000-0000-0000-0000-000000000005',
   'IND-2024-0005', 'Capt. Ananya Reddy',   'ananya.reddy@deas.mil',    '+91-9800000005',
   '$2b$12$dn79bnTvzPsku72mQGjDFO917YjhPnqqjQZWFsVv9hx9u9Ze1oHka',
   'OFFICER', 'Captain', 'OFF-0092', 'b1000000-0000-0000-0000-000000000004', 'a1000000-0000-0000-0000-000000000002', 3, 1),
  ('c1000000-0000-0000-0000-000000000006',
   'IND-2024-0006', 'Lt. Rohit Verma',      'rohit.verma@deas.mil',     '+91-9800000006',
   '$2b$12$dn79bnTvzPsku72mQGjDFO917YjhPnqqjQZWFsVv9hx9u9Ze1oHka',
   'OFFICER', 'Lieutenant', 'OFF-0093', 'b1000000-0000-0000-0000-000000000007', 'a1000000-0000-0000-0000-000000000003', 3, 1),

  -- SERGEANTS (Demo Role: Sergeant) — NEW
  ('c1000000-0000-0000-0000-000000000016',
   'IND-2024-SGT1', 'Sgt. Mehta Suresh',   'mehta.suresh@deas.mil',    '+91-9800000016',
   '$2b$12$dn79bnTvzPsku72mQGjDFO917YjhPnqqjQZWFsVv9hx9u9Ze1oHka',
   'SERGEANT', 'Sergeant', 'SGT-2201', 'b1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 2, 1),
  ('c1000000-0000-0000-0000-000000000017',
   'IND-2024-SGT2', 'Sgt. Rajan Pillai',   'rajan.pillai@deas.mil',    '+91-9800000017',
   '$2b$12$dn79bnTvzPsku72mQGjDFO917YjhPnqqjQZWFsVv9hx9u9Ze1oHka',
   'SERGEANT', 'Sergeant', 'SGT-2202', 'b1000000-0000-0000-0000-000000000004', 'a1000000-0000-0000-0000-000000000002', 2, 1),

  -- Quartermasters
  ('c1000000-0000-0000-0000-000000000007',
   'IND-2024-0007', 'Sgt. Deepak Patel',    'deepak.patel@deas.mil',    '+91-9800000007',
   '$2b$12$dn79bnTvzPsku72mQGjDFO917YjhPnqqjQZWFsVv9hx9u9Ze1oHka',
   'QUARTERMASTER', 'Sergeant', 'QM-3301', 'b1000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000001', 3, 1),
  ('c1000000-0000-0000-0000-000000000008',
   'IND-2024-0008', 'Sgt. Meena Krishnan',  'meena.krishnan@deas.mil',  '+91-9800000008',
   '$2b$12$dn79bnTvzPsku72mQGjDFO917YjhPnqqjQZWFsVv9hx9u9Ze1oHka',
   'QUARTERMASTER', 'Sergeant', 'QM-3302', 'b1000000-0000-0000-0000-000000000006', 'a1000000-0000-0000-0000-000000000002', 3, 1),

  -- Auditors
  ('c1000000-0000-0000-0000-000000000009',
   'IND-2024-0009', 'Maj. Suresh Iyer',     'suresh.iyer@deas.mil',     '+91-9800000009',
   '$2b$12$dn79bnTvzPsku72mQGjDFO917YjhPnqqjQZWFsVv9hx9u9Ze1oHka',
   'AUDITOR', 'Major', 'AUD-4401', 'b1000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000001', 4, 1),

  -- Technicians
  ('c1000000-0000-0000-0000-000000000010',
   'IND-2024-0010', 'Cpl. Amrit Rao',       'amrit.rao@deas.mil',       '+91-9800000010',
   '$2b$12$dn79bnTvzPsku72mQGjDFO917YjhPnqqjQZWFsVv9hx9u9Ze1oHka',
   'TECHNICIAN', 'Corporal', 'TEC-5501', 'b1000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000001', 2, 1),

  -- SOLDIERS (Demo Role: Soldier) — assigned to Sgt. Mehta Suresh (c16)
  ('c1000000-0000-0000-0000-000000000011',
   'IND-2024-0011', 'Pvt. Karan Gupta',     'karan.gupta@deas.mil',     '+91-9800000011',
   '$2b$12$dn79bnTvzPsku72mQGjDFO917YjhPnqqjQZWFsVv9hx9u9Ze1oHka',
   'SOLDIER', 'Private', 'SLD-4421', 'b1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 1, 1),
  ('c1000000-0000-0000-0000-000000000012',
   'IND-2024-0012', 'Pvt. Neha Joshi',      'neha.joshi@deas.mil',      '+91-9800000012',
   '$2b$12$dn79bnTvzPsku72mQGjDFO917YjhPnqqjQZWFsVv9hx9u9Ze1oHka',
   'SOLDIER', 'Private', 'SLD-4422', 'b1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 1, 1),
  ('c1000000-0000-0000-0000-000000000013',
   'IND-2024-0013', 'Cpl. Arun Kumar',      'arun.kumar@deas.mil',      '+91-9800000013',
   '$2b$12$dn79bnTvzPsku72mQGjDFO917YjhPnqqjQZWFsVv9hx9u9Ze1oHka',
   'SOLDIER', 'Corporal', 'SLD-4423', 'b1000000-0000-0000-0000-000000000004', 'a1000000-0000-0000-0000-000000000002', 1, 1),
  ('c1000000-0000-0000-0000-000000000014',
   'IND-2024-0014', 'Pvt. Sunita Bose',     'sunita.bose@deas.mil',     '+91-9800000014',
   '$2b$12$dn79bnTvzPsku72mQGjDFO917YjhPnqqjQZWFsVv9hx9u9Ze1oHka',
   'SOLDIER', 'Private', 'SLD-4424', 'b1000000-0000-0000-0000-000000000007', 'a1000000-0000-0000-0000-000000000003', 1, 1),
  ('c1000000-0000-0000-0000-000000000015',
   'IND-2024-0015', 'Cpl. Harish Menon',    'harish.menon@deas.mil',    '+91-9800000015',
   '$2b$12$dn79bnTvzPsku72mQGjDFO917YjhPnqqjQZWFsVv9hx9u9Ze1oHka',
   'SOLDIER', 'Corporal', 'SLD-4425', 'b1000000-0000-0000-0000-000000000004', 'a1000000-0000-0000-0000-000000000002', 1, 1);

-- Update commanding officers now that personnel exist
UPDATE bases SET commanding_officer_id = 'c1000000-0000-0000-0000-000000000002'
  WHERE id = 'a1000000-0000-0000-0000-000000000001';
UPDATE bases SET commanding_officer_id = 'c1000000-0000-0000-0000-000000000003'
  WHERE id = 'a1000000-0000-0000-0000-000000000002';
UPDATE bases SET commanding_officer_id = 'c1000000-0000-0000-0000-000000000006'
  WHERE id = 'a1000000-0000-0000-0000-000000000003';

UPDATE units SET commanding_officer_id = 'c1000000-0000-0000-0000-000000000004'
  WHERE id = 'b1000000-0000-0000-0000-000000000001';
UPDATE units SET commanding_officer_id = 'c1000000-0000-0000-0000-000000000005'
  WHERE id = 'b1000000-0000-0000-0000-000000000004';
UPDATE units SET commanding_officer_id = 'c1000000-0000-0000-0000-000000000006'
  WHERE id = 'b1000000-0000-0000-0000-000000000007';

-- Assign SERGEANT hierarchy: Sergeants assigned to Officers
UPDATE personnel SET assigned_officer_id = 'c1000000-0000-0000-0000-000000000004'
  WHERE id = 'c1000000-0000-0000-0000-000000000016'; -- Sgt. Mehta → Major Vikram
UPDATE personnel SET assigned_officer_id = 'c1000000-0000-0000-0000-000000000005'
  WHERE id = 'c1000000-0000-0000-0000-000000000017'; -- Sgt. Rajan → Capt. Ananya

-- Assign SOLDIER hierarchy: Soldiers assigned to Sergeants
UPDATE personnel SET assigned_sergeant_id = 'c1000000-0000-0000-0000-000000000016'
  WHERE id IN (
    'c1000000-0000-0000-0000-000000000011', -- Pvt. Karan Gupta
    'c1000000-0000-0000-0000-000000000012'  -- Pvt. Neha Joshi
  ); -- assigned to Sgt. Mehta Suresh

UPDATE personnel SET assigned_sergeant_id = 'c1000000-0000-0000-0000-000000000017'
  WHERE id IN (
    'c1000000-0000-0000-0000-000000000013', -- Cpl. Arun Kumar
    'c1000000-0000-0000-0000-000000000015'  -- Cpl. Harish Menon
  ); -- assigned to Sgt. Rajan Pillai

-- ============================================================
-- EQUIPMENT CATEGORIES (12 categories)
-- ============================================================
INSERT INTO equipment_categories (id, name, display_name, criticality_level, maintenance_interval_days, max_checkout_hours, requires_officer_approval, icon_name) VALUES
  ('d1000000-0000-0000-0000-000000000001', 'RIFLE',               'Assault Rifle',          'HIGH',   30,  72,  false, 'Target'),
  ('d1000000-0000-0000-0000-000000000002', 'PISTOL',              'Service Pistol',         'HIGH',   60,  48,  false, 'Target'),
  ('d1000000-0000-0000-0000-000000000003', 'NIGHT_VISION',        'Night Vision Device',    'HIGH',   90,  24,  true,  'Eye'),
  ('d1000000-0000-0000-0000-000000000004', 'DRONE',               'Surveillance Drone',     'HIGH',   30,  12,  true,  'Plane'),
  ('d1000000-0000-0000-0000-000000000005', 'VEHICLE',             'Military Vehicle',       'HIGH',   60,  96,  true,  'Truck'),
  ('d1000000-0000-0000-0000-000000000006', 'RADIO',               'Tactical Radio',         'MEDIUM', 90,  72,  false, 'Radio'),
  ('d1000000-0000-0000-0000-000000000007', 'BODY_ARMOR',          'Body Armor Vest',        'HIGH',   180, 168, false, 'Shield'),
  ('d1000000-0000-0000-0000-000000000008', 'MEDICAL_KIT',         'Medical Kit',            'HIGH',   30,  48,  false, 'Cross'),
  ('d1000000-0000-0000-0000-000000000009', 'GPS_DEVICE',          'GPS Navigation Device',  'MEDIUM', 90,  48,  false, 'MapPin'),
  ('d1000000-0000-0000-0000-000000000010', 'TACTICAL_LAPTOP',     'Tactical Laptop',        'MEDIUM', 90,  72,  false, 'Monitor'),
  ('d1000000-0000-0000-0000-000000000011', 'SURVEILLANCE_CAMERA', 'Surveillance Camera',    'MEDIUM', 60,  48,  true,  'Camera'),
  ('d1000000-0000-0000-0000-000000000012', 'EXPLOSIVE_KIT',       'Explosive Ordnance Kit', 'HIGH',   14,  12,  true,  'AlertTriangle');

-- ============================================================
-- EQUIPMENT (20 items across all categories)
-- ============================================================
INSERT INTO equipment (id, serial_number, name, category_id, description, manufacturer, model_number, purchase_date, purchase_price, status, condition, home_base_id, home_unit_id, specifications) VALUES
  -- Rifles (4)
  ('e1000000-0000-0000-0000-000000000001', 'RFL-2024-00001', 'INSAS Assault Rifle Mk.2',
   'd1000000-0000-0000-0000-000000000001',
   'Standard issue 5.56mm assault rifle with under-barrel grenade launcher mount',
   'Ordnance Factory Board', 'INSAS-MK2', '2022-03-15', 85000.00,
   'OPERATIONAL', 'GOOD',
   'a1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000001',
   '{"caliber": "5.56x45mm", "weight_kg": 4.15, "length_mm": 960, "magazine_capacity": 20, "effective_range_m": 400}'),

  ('e1000000-0000-0000-0000-000000000002', 'RFL-2024-00002', 'AK-203 Assault Rifle',
   'd1000000-0000-0000-0000-000000000001',
   '7.62mm assault rifle — Indo-Russian joint production',
   'Indo-Russian Rifles Pvt. Ltd.', 'AK-203', '2023-06-10', 140000.00,
   'CHECKED_OUT', 'EXCELLENT',
   'a1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000001',
   '{"caliber": "7.62x39mm", "weight_kg": 3.8, "length_mm": 943, "magazine_capacity": 30, "effective_range_m": 500}'),

  ('e1000000-0000-0000-0000-000000000003', 'RFL-2024-00003', 'INSAS Assault Rifle Mk.2',
   'd1000000-0000-0000-0000-000000000001',
   'Standard issue 5.56mm assault rifle',
   'Ordnance Factory Board', 'INSAS-MK2', '2022-03-15', 85000.00,
   'UNDER_MAINTENANCE', 'FAIR',
   'a1000000-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000004',
   '{"caliber": "5.56x45mm", "weight_kg": 4.15, "length_mm": 960, "magazine_capacity": 20, "effective_range_m": 400}'),

  ('e1000000-0000-0000-0000-000000000004', 'RFL-2024-00004', 'Tavor X95 Rifle',
   'd1000000-0000-0000-0000-000000000001',
   'Bullpup assault rifle for compact operations',
   'IWI', 'X95', '2023-09-20', 320000.00,
   'OPERATIONAL', 'EXCELLENT',
   'a1000000-0000-0000-0000-000000000003', 'b1000000-0000-0000-0000-000000000007',
   '{"caliber": "5.56x45mm", "weight_kg": 2.95, "length_mm": 590, "magazine_capacity": 30, "effective_range_m": 550}'),

  -- Night Vision (2)
  ('e1000000-0000-0000-0000-000000000005', 'NVD-2024-00001', 'PVS-14 Monocular NVD',
   'd1000000-0000-0000-0000-000000000003',
   '3rd generation image intensifier night vision monocular',
   'L3Harris', 'AN/PVS-14', '2021-11-05', 380000.00,
   'OPERATIONAL', 'GOOD',
   'a1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000001',
   '{"generation": "Gen3", "magnification": "1x", "fov_degrees": 40, "detection_range_m": 300, "weight_g": 390}'),

  ('e1000000-0000-0000-0000-000000000006', 'NVD-2024-00002', 'FLIR Breach PTQ136 Thermal',
   'd1000000-0000-0000-0000-000000000003',
   'Pocket-sized thermal monocular for surveillance',
   'FLIR Systems', 'PTQ136', '2023-02-14', 520000.00,
   'CHECKED_OUT', 'EXCELLENT',
   'a1000000-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000004',
   '{"sensor": "LWIR", "resolution": "160x120", "detection_range_m": 900, "battery_life_hrs": 2.5, "weight_g": 170}'),

  -- Drones (2)
  ('e1000000-0000-0000-0000-000000000007', 'DRN-2024-00001', 'DJI Matrice 300 RTK',
   'd1000000-0000-0000-0000-000000000004',
   'Enterprise reconnaissance drone with thermal and optical payload',
   'DJI', 'M300 RTK', '2023-01-20', 1200000.00,
   'OPERATIONAL', 'EXCELLENT',
   'a1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000002',
   '{"max_flight_time_min": 55, "max_speed_kmh": 82, "max_altitude_m": 7000, "ip_rating": "IP45", "payload_g": 2700}'),

  ('e1000000-0000-0000-0000-000000000008', 'DRN-2024-00002', 'Skylark I-LEX UAV',
   'd1000000-0000-0000-0000-000000000004',
   'Man-portable tactical UAV for battlefield reconnaissance',
   'Elbit Systems', 'Skylark-I', '2022-07-30', 2800000.00,
   'FLAGGED', 'POOR',
   'a1000000-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000004',
   '{"endurance_hrs": 3, "range_km": 40, "wingspan_m": 2.4, "weight_kg": 5.5, "assembly_min": 10}'),

  -- Vehicles (2)
  ('e1000000-0000-0000-0000-000000000009', 'VEH-2024-00001', 'Tata LPTA 713 TC',
   'd1000000-0000-0000-0000-000000000005',
   '4x4 light military truck for troop & supply transport',
   'Tata Motors', 'LPTA-713TC', '2020-05-12', 3200000.00,
   'OPERATIONAL', 'GOOD',
   'a1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000001',
   '{"seats": 12, "payload_kg": 1500, "max_speed_kmh": 90, "engine": "6-cylinder diesel", "fuel_capacity_l": 200}'),

  ('e1000000-0000-0000-0000-000000000010', 'VEH-2024-00002', 'Mahindra Armado',
   'd1000000-0000-0000-0000-000000000005',
   'Mine-protected light strike vehicle',
   'Mahindra Defence', 'Armado MK1', '2023-04-18', 5600000.00,
   'IN_TRANSIT', 'EXCELLENT',
   'a1000000-0000-0000-0000-000000000003', 'b1000000-0000-0000-0000-000000000007',
   '{"seats": 8, "armor": "STANAG Level 2", "max_speed_kmh": 120, "range_km": 500, "fuel_capacity_l": 90}'),

  -- Radios (2)
  ('e1000000-0000-0000-0000-000000000011', 'RAD-2024-00001', 'Harris AN/PRC-152A MBITR',
   'd1000000-0000-0000-0000-000000000006',
   'Multiband tactical radio with SATCOM capability',
   'L3Harris', 'AN/PRC-152A', '2022-09-08', 420000.00,
   'OPERATIONAL', 'GOOD',
   'a1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000002',
   '{"frequency_range": "30-512 MHz", "power_w": 5, "battery_life_hrs": 12, "weight_g": 567, "encryption": "AES-256"}'),

  ('e1000000-0000-0000-0000-000000000012', 'RAD-2024-00002', 'BEL Tactical HF/VHF Radio',
   'd1000000-0000-0000-0000-000000000006',
   'Portable HF/VHF radio for long-range communication',
   'Bharat Electronics Limited', 'TRC-5000', '2021-12-01', 180000.00,
   'OPERATIONAL', 'FAIR',
   'a1000000-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000006',
   '{"frequency_range": "1.6-60 MHz", "power_w": 20, "weight_kg": 3.2, "range_km": 50}'),

  -- Body Armor (2)
  ('e1000000-0000-0000-0000-000000000013', 'ARM-2024-00001', 'DRDO Bhabha Kavach Mk.3',
   'd1000000-0000-0000-0000-000000000007',
   'NIJ Level IV ceramic plate body armor',
   'DRDO / MKU Ltd.', 'Kavach-MK3', '2023-08-22', 95000.00,
   'OPERATIONAL', 'EXCELLENT',
   'a1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000001',
   '{"nij_level": "IV", "weight_kg": 9.5, "coverage_sqcm": 800, "material": "SiC Ceramic + Kevlar"}'),

  ('e1000000-0000-0000-0000-000000000014', 'ARM-2024-00002', 'DRDO Bhabha Kavach Mk.3',
   'd1000000-0000-0000-0000-000000000007',
   'NIJ Level IV ceramic plate body armor',
   'DRDO / MKU Ltd.', 'Kavach-MK3', '2023-08-22', 95000.00,
   'MISSING', 'GOOD',
   'a1000000-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000005',
   '{"nij_level": "IV", "weight_kg": 9.5, "coverage_sqcm": 800, "material": "SiC Ceramic + Kevlar"}'),

  -- Medical Kits (2)
  ('e1000000-0000-0000-0000-000000000015', 'MED-2024-00001', 'TCCC Combat Trauma Kit',
   'd1000000-0000-0000-0000-000000000008',
   'Tactical Combat Casualty Care individual first aid kit',
   'North American Rescue', 'M-FAK', '2024-01-10', 28000.00,
   'OPERATIONAL', 'GOOD',
   'a1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000001',
   '{"includes": ["tourniquet", "hemostatic gauze", "chest seal", "NPA"], "weight_g": 680}'),

  ('e1000000-0000-0000-0000-000000000016', 'MED-2024-00002', 'Extended Care Medical Kit',
   'd1000000-0000-0000-0000-000000000008',
   'Extended field medical kit for CASEVAC operations',
   'Chinook Medical Gear', 'ECMK-XL', '2024-01-10', 65000.00,
   'CHECKED_OUT', 'GOOD',
   'a1000000-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000005',
   '{"includes": ["IV kit", "airway management", "burn care", "splints"], "weight_kg": 4.2}'),

  -- GPS Devices (2)
  ('e1000000-0000-0000-0000-000000000017', 'GPS-2024-00001', 'Garmin GPSMAP 64sx',
   'd1000000-0000-0000-0000-000000000009',
   'Rugged handheld GPS with multi-GNSS support',
   'Garmin', 'GPSMAP 64sx', '2022-06-15', 42000.00,
   'OPERATIONAL', 'GOOD',
   'a1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000001',
   '{"accuracy_m": 3, "battery_life_hrs": 16, "waterproof": "IPX7", "weight_g": 236, "display": "2.6 inch TFT"}'),

  ('e1000000-0000-0000-0000-000000000018', 'GPS-2024-00002', 'Trimble Nomad 5 GIS',
   'd1000000-0000-0000-0000-000000000009',
   'Military-grade GPS data collector for field mapping',
   'Trimble', 'Nomad 5', '2023-03-20', 185000.00,
   'OPERATIONAL', 'EXCELLENT',
   'a1000000-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000004',
   '{"accuracy_m": 1, "os": "Windows 10", "battery_hrs": 10, "waterproof": "IP67", "weight_g": 590}'),

  -- Tactical Laptops (1)
  ('e1000000-0000-0000-0000-000000000019', 'LAP-2024-00001', 'Panasonic Toughbook 55',
   'd1000000-0000-0000-0000-000000000010',
   'MIL-STD-810H rugged laptop for field command operations',
   'Panasonic', 'CF-55', '2023-07-01', 420000.00,
   'OPERATIONAL', 'EXCELLENT',
   'a1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000002',
   '{"cpu": "Intel Core i5", "ram_gb": 16, "storage_gb": 512, "display_inch": 14, "battery_hrs": 20, "mil_spec": "MIL-STD-810H"}'),

  -- Surveillance Camera (1)
  ('e1000000-0000-0000-0000-000000000020', 'CAM-2024-00001', 'FLIR Scout III-640',
   'd1000000-0000-0000-0000-000000000011',
   'Handheld thermal camera for perimeter surveillance',
   'FLIR Systems', 'Scout III-640', '2022-11-15', 580000.00,
   'OPERATIONAL', 'GOOD',
   'a1000000-0000-0000-0000-000000000003', 'b1000000-0000-0000-0000-000000000009',
   '{"resolution": "640x480", "detection_range_m": 1800, "battery_hrs": 4, "weight_g": 1050, "fov_degrees": 18}');

-- ============================================================
-- CHECKOUT RECORDS (4 active checkouts for demo)
-- ============================================================
INSERT INTO checkout_records (
  id, equipment_id, equipment_serial, equipment_name,
  checked_out_by_id, checked_out_by_name, checked_out_by_service_number,
  approved_by_id, approved_by_name,
  checkout_base_id, checkout_unit_id,
  purpose, expected_return_at, actual_checkout_at,
  status, condition_on_checkout,
  digital_signature_data, signature_verified_at,
  biometric_verified, biometric_type, biometric_verified_at,
  checkout_latitude, checkout_longitude
) VALUES
  -- Active checkout: AK-203 by Karan Gupta (MISSION)
  ('f1000000-0000-0000-0000-000000000001',
   'e1000000-0000-0000-0000-000000000002', 'RFL-2024-00002', 'AK-203 Assault Rifle',
   'c1000000-0000-0000-0000-000000000011', 'Pvt. Karan Gupta', 'IND-2024-0011',
   'c1000000-0000-0000-0000-000000000004', 'Major Vikram Singh',
   'a1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000001',
   'MISSION', NOW() + INTERVAL '12 hours', NOW() - INTERVAL '2 hours',
   'ACTIVE', 'EXCELLENT',
   'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScAAAAAElFTkSuQmCC',
   NOW() - INTERVAL '2 hours',
   true, 'FINGERPRINT', NOW() - INTERVAL '2 hours',
   32.72600000, 74.85700000),

  -- Active checkout: FLIR Thermal by Arun Kumar (TRAINING)
  ('f1000000-0000-0000-0000-000000000002',
   'e1000000-0000-0000-0000-000000000006', 'NVD-2024-00002', 'FLIR Breach PTQ136 Thermal',
   'c1000000-0000-0000-0000-000000000013', 'Cpl. Arun Kumar', 'IND-2024-0013',
   'c1000000-0000-0000-0000-000000000005', 'Capt. Ananya Reddy',
   'a1000000-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000004',
   'TRAINING', NOW() + INTERVAL '6 hours', NOW() - INTERVAL '1 hour',
   'ACTIVE', 'EXCELLENT',
   'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScAAAAAElFTkSuQmCC',
   NOW() - INTERVAL '1 hour',
   true, 'FACE_ID', NOW() - INTERVAL '1 hour',
   27.33400000, 88.61700000),

  -- OVERDUE checkout: Medical Kit by Neha Joshi (expected 4 hours ago)
  ('f1000000-0000-0000-0000-000000000003',
   'e1000000-0000-0000-0000-000000000016', 'MED-2024-00002', 'Extended Care Medical Kit',
   'c1000000-0000-0000-0000-000000000012', 'Pvt. Neha Joshi', 'IND-2024-0012',
   'c1000000-0000-0000-0000-000000000004', 'Major Vikram Singh',
   'a1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000001',
   'TRAINING', NOW() - INTERVAL '4 hours', NOW() - INTERVAL '28 hours',
   'OVERDUE', 'GOOD',
   'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScAAAAAElFTkSuQmCC',
   NOW() - INTERVAL '28 hours',
   false, NULL, NULL,
   32.72600000, 74.85700000),

  -- Active checkout: Harish Menon (EXERCISE)
  ('f1000000-0000-0000-0000-000000000004',
   'e1000000-0000-0000-0000-000000000017', 'GPS-2024-00001', 'Garmin GPSMAP 64sx',
   'c1000000-0000-0000-0000-000000000015', 'Sgt. Harish Menon', 'IND-2024-0015',
   'c1000000-0000-0000-0000-000000000005', 'Capt. Ananya Reddy',
   'a1000000-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000004',
   'EXERCISE', NOW() + INTERVAL '48 hours', NOW() - INTERVAL '3 hours',
   'ACTIVE', 'GOOD',
   'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScAAAAAElFTkSuQmCC',
   NOW() - INTERVAL '3 hours',
   true, 'FINGERPRINT', NOW() - INTERVAL '3 hours',
   27.33400000, 88.61700000);

-- Update equipment to reflect current checkouts
UPDATE equipment SET
  status = 'CHECKED_OUT',
  current_custodian_id = 'c1000000-0000-0000-0000-000000000011',
  current_checkout_id  = 'f1000000-0000-0000-0000-000000000001',
  total_checkout_count = total_checkout_count + 1
WHERE id = 'e1000000-0000-0000-0000-000000000002';

UPDATE equipment SET
  status = 'CHECKED_OUT',
  current_custodian_id = 'c1000000-0000-0000-0000-000000000013',
  current_checkout_id  = 'f1000000-0000-0000-0000-000000000002',
  total_checkout_count = total_checkout_count + 1
WHERE id = 'e1000000-0000-0000-0000-000000000006';

UPDATE equipment SET
  status = 'CHECKED_OUT',
  current_custodian_id = 'c1000000-0000-0000-0000-000000000012',
  current_checkout_id  = 'f1000000-0000-0000-0000-000000000003',
  total_checkout_count = total_checkout_count + 1
WHERE id = 'e1000000-0000-0000-0000-000000000016';

-- ============================================================
-- CUSTODY CHAIN (initial entries for all equipment)
-- ============================================================
INSERT INTO custody_chain (equipment_id, event_type, to_custodian_id, to_custodian_name, to_location, performed_by_id, performed_by_name, notes)
SELECT
  e.id,
  'INITIAL_ENTRY',
  'c1000000-0000-0000-0000-000000000007',
  'Sgt. Deepak Patel',
  b.name,
  'c1000000-0000-0000-0000-000000000007',
  'Sgt. Deepak Patel',
  'Initial equipment registration'
FROM equipment e
JOIN bases b ON b.id = e.home_base_id;

-- Custody entries for active checkouts
INSERT INTO custody_chain (equipment_id, event_type, from_custodian_name, to_custodian_id, to_custodian_name, checkout_record_id, performed_by_id, performed_by_name)
VALUES
  ('e1000000-0000-0000-0000-000000000002', 'CHECKED_OUT', 'Sgt. Deepak Patel',
   'c1000000-0000-0000-0000-000000000011', 'Pvt. Karan Gupta',
   'f1000000-0000-0000-0000-000000000001',
   'c1000000-0000-0000-0000-000000000007', 'Sgt. Deepak Patel'),
  ('e1000000-0000-0000-0000-000000000006', 'CHECKED_OUT', 'Sgt. Meena Krishnan',
   'c1000000-0000-0000-0000-000000000013', 'Cpl. Arun Kumar',
   'f1000000-0000-0000-0000-000000000002',
   'c1000000-0000-0000-0000-000000000008', 'Sgt. Meena Krishnan'),
  ('e1000000-0000-0000-0000-000000000016', 'CHECKED_OUT', 'Sgt. Meena Krishnan',
   'c1000000-0000-0000-0000-000000000012', 'Pvt. Neha Joshi',
   'f1000000-0000-0000-0000-000000000003',
   'c1000000-0000-0000-0000-000000000008', 'Sgt. Meena Krishnan');

-- ============================================================
-- ALERTS (6 pre-seeded alerts)
-- ============================================================
INSERT INTO alerts (id, type, severity, title, message, equipment_id, personnel_id, checkout_id, base_id, status, auto_generated) VALUES
  ('71000000-0000-0000-0000-000000000001',
   'OVERDUE_RETURN', 'HIGH',
   'Overdue: Extended Care Medical Kit',
   'MED-2024-00002 checked out by Pvt. Neha Joshi is 4 hours overdue. Expected return was ' || (NOW() - INTERVAL '4 hours')::TEXT,
   'e1000000-0000-0000-0000-000000000016',
   'c1000000-0000-0000-0000-000000000012',
   'f1000000-0000-0000-0000-000000000003',
   'a1000000-0000-0000-0000-000000000001',
   'OPEN', true),

  ('71000000-0000-0000-0000-000000000002',
   'EQUIPMENT_MISSING', 'CRITICAL',
   'Missing: Body Armor ARM-2024-00002',
   'Body armor vest assigned to Echo Medical unit has been reported missing. Last known location: Eastern Outpost Alpha.',
   'e1000000-0000-0000-0000-000000000014', NULL, NULL,
   'a1000000-0000-0000-0000-000000000002',
   'OPEN', true),

  ('71000000-0000-0000-0000-000000000003',
   'MAINTENANCE_DUE', 'MEDIUM',
   'Maintenance Due: Skylark I-LEX UAV',
   'DRN-2024-00002 is flagged and overdue for maintenance. Current condition: POOR.',
   'e1000000-0000-0000-0000-000000000008', NULL, NULL,
   'a1000000-0000-0000-0000-000000000002',
   'ACKNOWLEDGED', true),

  ('71000000-0000-0000-0000-000000000004',
   'ANOMALY_DETECTED', 'HIGH',
   'Anomaly: Unusual Login Pattern Detected',
   'ML anomaly detection flagged unusual login activity from service number IND-2024-0011 outside of normal duty hours.',
   NULL,
   'c1000000-0000-0000-0000-000000000011', NULL,
   'a1000000-0000-0000-0000-000000000001',
   'OPEN', true),

  ('71000000-0000-0000-0000-000000000005',
   'TRANSFER_PENDING_APPROVAL', 'MEDIUM',
   'Transfer Pending: Mahindra Armado VEH-2024-00002',
   'Vehicle transfer from Western Desert Command to Northern Command HQ is awaiting receiver approval.',
   'e1000000-0000-0000-0000-000000000010', NULL, NULL,
   'a1000000-0000-0000-0000-000000000003',
   'OPEN', true),

  ('71000000-0000-0000-0000-000000000006',
   'EQUIPMENT_DAMAGED', 'MEDIUM',
   'Flagged Equipment: Skylark I-LEX UAV in POOR condition',
   'UAV DRN-2024-00002 condition has degraded to POOR. Immediate inspection required.',
   'e1000000-0000-0000-0000-000000000008', NULL, NULL,
   'a1000000-0000-0000-0000-000000000002',
   'OPEN', true);

-- ============================================================
-- MAINTENANCE RECORDS (3 records)
-- ============================================================
INSERT INTO maintenance_records (equipment_id, equipment_serial, type, status, scheduled_date, assigned_technician_id, assigned_technician_name, description) VALUES
  ('e1000000-0000-0000-0000-000000000003', 'RFL-2024-00003', 'ROUTINE', 'IN_PROGRESS',
   CURRENT_DATE,
   'c1000000-0000-0000-0000-000000000010', 'Cpl. Amrit Rao',
   'Routine cleaning, bore inspection, and function check'),

  ('e1000000-0000-0000-0000-000000000008', 'DRN-2024-00002', 'EMERGENCY', 'SCHEDULED',
   CURRENT_DATE + INTERVAL '1 day',
   'c1000000-0000-0000-0000-000000000010', 'Cpl. Amrit Rao',
   'Emergency repair: gimbal damage and sensor calibration'),

  ('e1000000-0000-0000-0000-000000000005', 'NVD-2024-00001', 'ROUTINE', 'SCHEDULED',
   CURRENT_DATE + INTERVAL '7 days',
   'c1000000-0000-0000-0000-000000000010', 'Cpl. Amrit Rao',
   'Scheduled 90-day lens cleaning and performance calibration');

-- ============================================================
-- TRANSFER REQUEST (1 demo transfer - vehicle IN_TRANSIT)
-- ============================================================
INSERT INTO transfer_requests (
  id, equipment_id, equipment_serial, request_type,
  from_base_id, from_unit_id, to_base_id, to_unit_id,
  requested_by_id, requesting_officer_id, receiving_officer_id,
  status, reason, priority,
  sender_approved_at, receiver_approved_at, dispatched_at,
  dispatch_latitude, dispatch_longitude
) VALUES (
  '81000000-0000-0000-0000-000000000001',
  'e1000000-0000-0000-0000-000000000010', 'VEH-2024-00002', 'INTER_BASE',
  'a1000000-0000-0000-0000-000000000003', 'b1000000-0000-0000-0000-000000000007',
  'a1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000001',
  'c1000000-0000-0000-0000-000000000006', 'c1000000-0000-0000-0000-000000000006', 'c1000000-0000-0000-0000-000000000004',
  'IN_TRANSIT',
  'Northern Command requires additional mine-protected vehicle for upcoming exercise SHAKTI-26.',
  'HIGH',
  NOW() - INTERVAL '2 days',
  NOW() - INTERVAL '1 day',
  NOW() - INTERVAL '6 hours',
  26.91200000, 70.90600000
);

-- ============================================================
-- INCIDENT REPORT (1 demo — missing body armor)
-- ============================================================
INSERT INTO incident_reports (
  equipment_id, equipment_serial, type, severity, title, description,
  incident_datetime, reported_by_id, reported_by_name,
  responsible_personnel_id, responsible_personnel_name,
  last_known_location_description, status
) VALUES (
  'e1000000-0000-0000-0000-000000000014', 'ARM-2024-00002',
  'LOST', 'SEVERE',
  'Body Armor Vest Missing — Echo Medical Unit',
  'Body armor vest Kavach MK3 (ARM-2024-00002) was not found during routine evening equipment check. Last seen during morning drill. All personnel in Echo Medical questioned — item unaccounted for.',
  NOW() - INTERVAL '8 hours',
  'c1000000-0000-0000-0000-000000000008', 'Sgt. Meena Krishnan',
  NULL, NULL,
  'Eastern Outpost Alpha — Echo Medical Barracks, Locker Room 4B',
  'UNDER_INVESTIGATION'
);

-- ============================================================
-- GEOFENCE ZONES (3 zones across bases)
-- ============================================================
INSERT INTO geofence_zones (name, base_id, type, shape, center_latitude, center_longitude, radius_meters, alert_on_entry, alert_on_exit, applicable_to_roles, created_by) VALUES
  ('NCH Perimeter Zone',
   'a1000000-0000-0000-0000-000000000001', 'PERIMETER', 'CIRCLE',
   32.72600000, 74.85700000, 5000,
   false, true, '{"SOLDIER","OFFICER"}',
   'c1000000-0000-0000-0000-000000000002'),

  ('EOA Restricted Armory',
   'a1000000-0000-0000-0000-000000000002', 'RESTRICTED', 'CIRCLE',
   27.33600000, 88.61500000, 200,
   true, false, '{"ALL"}',
   'c1000000-0000-0000-0000-000000000003'),

  ('WDC Vehicle Depot',
   'a1000000-0000-0000-0000-000000000003', 'AUTHORIZED', 'CIRCLE',
   26.91200000, 70.90600000, 800,
   false, true, '{"SOLDIER","OFFICER","QUARTERMASTER"}',
   'c1000000-0000-0000-0000-000000000006');

-- ============================================================
-- AUDIT LOG ENTRIES (initial system events)
-- ============================================================
INSERT INTO audit_logs (action, performed_by_id, performed_by_name, performed_by_role, performed_by_service_number, target_entity_type, target_entity_id, target_entity_name, device_type, severity)
VALUES
  ('EQUIPMENT_ADDED', 'c1000000-0000-0000-0000-000000000007', 'Sgt. Deepak Patel', 'QUARTERMASTER', 'IND-2024-0007', 'EQUIPMENT', 'e1000000-0000-0000-0000-000000000001', 'INSAS Assault Rifle Mk.2', 'WEB', 'INFO'),
  ('EQUIPMENT_ADDED', 'c1000000-0000-0000-0000-000000000007', 'Sgt. Deepak Patel', 'QUARTERMASTER', 'IND-2024-0007', 'EQUIPMENT', 'e1000000-0000-0000-0000-000000000002', 'AK-203 Assault Rifle', 'WEB', 'INFO'),
  ('EQUIPMENT_CHECKOUT', 'c1000000-0000-0000-0000-000000000011', 'Pvt. Karan Gupta', 'SOLDIER', 'IND-2024-0011', 'CHECKOUT', 'f1000000-0000-0000-0000-000000000001', 'AK-203 Assault Rifle', 'MOBILE', 'INFO'),
  ('BIOMETRIC_SUCCESS', 'c1000000-0000-0000-0000-000000000011', 'Pvt. Karan Gupta', 'SOLDIER', 'IND-2024-0011', 'PERSONNEL', 'c1000000-0000-0000-0000-000000000011', 'Pvt. Karan Gupta', 'MOBILE', 'INFO'),
  ('EQUIPMENT_CHECKOUT', 'c1000000-0000-0000-0000-000000000013', 'Cpl. Arun Kumar', 'SOLDIER', 'IND-2024-0013', 'CHECKOUT', 'f1000000-0000-0000-0000-000000000002', 'FLIR Breach PTQ136 Thermal', 'MOBILE', 'INFO'),
  ('ALERT_CREATED', 'c1000000-0000-0000-0000-000000000007', 'Sgt. Deepak Patel', 'QUARTERMASTER', 'IND-2024-0007', 'ALERT', '71000000-0000-0000-0000-000000000001', 'Overdue: Extended Care Medical Kit', 'SYSTEM', 'WARNING'),
  ('INCIDENT_REPORTED', 'c1000000-0000-0000-0000-000000000008', 'Sgt. Meena Krishnan', 'QUARTERMASTER', 'IND-2024-0008', 'EQUIPMENT', 'e1000000-0000-0000-0000-000000000014', 'Body Armor Vest Missing', 'WEB', 'CRITICAL'),
  ('ANOMALY_DETECTED', NULL, 'SYSTEM', 'SYSTEM', NULL, 'PERSONNEL', 'c1000000-0000-0000-0000-000000000011', 'Pvt. Karan Gupta', 'SYSTEM', 'WARNING');

-- ============================================================
-- LOCATION PINGS (demo GPS pings for active checkouts)
-- ============================================================
INSERT INTO location_pings (equipment_id, personnel_id, checkout_id, latitude, longitude, accuracy_meters, speed_kmph, is_in_authorized_zone, zone_name)
VALUES
  ('e1000000-0000-0000-0000-000000000002',
   'c1000000-0000-0000-0000-000000000011',
   'f1000000-0000-0000-0000-000000000001',
   32.73100000, 74.86200000, 5.0, 0.0, true, 'NCH Perimeter Zone'),
  ('e1000000-0000-0000-0000-000000000006',
   'c1000000-0000-0000-0000-000000000013',
   'f1000000-0000-0000-0000-000000000002',
   27.34100000, 88.62300000, 4.5, 12.0, true, 'EOA Authorized Zone');

-- ============================================================
-- DONE — seed complete
-- ============================================================
-- Login credentials for all seed users:
--   Password: Deas@2024!
--   Super Admin:    arjun.mehta@deas.mil
--   Base Admin:     priya.sharma@deas.mil / rajiv.nair@deas.mil
--   Officer:        vikram.singh@deas.mil / ananya.reddy@deas.mil / rohit.verma@deas.mil
--   Quartermaster:  deepak.patel@deas.mil / meena.krishnan@deas.mil
--   Auditor:        suresh.iyer@deas.mil
--   Technician:     amrit.rao@deas.mil
--   Soldiers:       karan.gupta@deas.mil / neha.joshi@deas.mil / arun.kumar@deas.mil
--                   sunita.bose@deas.mil / harish.menon@deas.mil
