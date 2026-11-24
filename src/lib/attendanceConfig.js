// Standard shift window used to auto-determine attendance status.
// Change these two values in one place if the org's official hours change.
export const SHIFT_START_TIME = "10:00"; // 10:00 AM
export const SHIFT_END_TIME = "17:00";   // 5:00 PM

const toMinutes = (hhmm) => {
    const [h, m] = hhmm.split(":").map(Number);
    return h * 60 + m;
};

// Given a "HH:MM" check-in time (or empty/null), returns the derived
// { status, lateMinutes } pair:
//   - no check-in at all           -> Absent
//   - check-in after shift start   -> Late, with minutes over
//   - check-in at/before start     -> Present
export const computeAttendanceStatus = (checkInTime) => {
    if (!checkInTime) return { status: "Absent", lateMinutes: null };

    const shiftStart = toMinutes(SHIFT_START_TIME);
    const checkIn = toMinutes(checkInTime);

    if (checkIn > shiftStart) {
        return { status: "Late", lateMinutes: checkIn - shiftStart };
    }
    return { status: "Present", lateMinutes: null };
};