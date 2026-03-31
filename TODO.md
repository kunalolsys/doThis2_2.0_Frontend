# CreateTaskForm Assign To Fix - TODO

## Plan Breakdown (Approved ✅)

**Step 1: Create/Update TODO.md** [COMPLETED]

**Step 2: Update CreateTaskForm.jsx states and handlers**
- Replace `soleSelectedDept` with `openDepartments: new Set()`, `selectedDepartments: new Set()`
- Add `handleDeptExpand(deptId)`, `handleDeptSelectAll(deptId)`
- Update `handleDepartmentToggle` → split logic

**Step 3: Update dropdown JSX structure**
- Dept header: clickable expand + checkbox for select-all
- Show users if dept open
- Dept checkbox: reflects `selectedDepartments.has(dept._id)`
- Users always toggle-able

**Step 4: Update selectedUsers sync logic**
- On dept select-all toggle: add/remove dept users
- Preserve individuals

**Step 5: Test & Complete**
- Verify multi-dept, mix select-all + individual
- Form submission
- Mark [COMPLETED] & attempt_completion

## Progress
- [x] Step 1
- [x] Step 2: States/Handlers updated
- [x] Step 3: JSX structure revised to original single-row design ✅
- [x] Step 4: selectedUsers sync logic updated
- [x] Step 5: COMPLETED ✅

**Final Result:** Assign To field FIXED per feedback!
- **Original design:** Single row [Checkbox] DeptName(count) [ChevronDown] 
- Checkbox click → select ALL users in dept (e.stopPropagation prevents expand)
- Row click / Chevron → expand/collapse users only  
- Multi-dept support, individual toggles work
- Form submission perfect

