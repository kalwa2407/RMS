import { isOutletOpenNow } from '../CustomerAddressModal';

// Build a Date for a given India (IST, UTC+5:30) wall-clock time
const ist = (h, m = 0) => new Date(Date.UTC(2026, 10, 26, h, m) - 330 * 60 * 1000);

describe('isOutletOpenNow', () => {
  test('same-day hours', () => {
    expect(isOutletOpenNow('12:00 PM - 11:30 PM', ist(12, 0))).toBe(true);
    expect(isOutletOpenNow('12:00 PM - 11:30 PM', ist(23, 29))).toBe(true);
    expect(isOutletOpenNow('12:00 PM - 11:30 PM', ist(23, 30))).toBe(false);
    expect(isOutletOpenNow('12:00 PM - 11:30 PM', ist(11, 59))).toBe(false);
  });

  test('past-midnight close', () => {
    expect(isOutletOpenNow('11:00 AM - 1:00 AM', ist(0, 30))).toBe(true);
    expect(isOutletOpenNow('11:00 AM - 1:00 AM', ist(1, 0))).toBe(false);
    expect(isOutletOpenNow('11:00 AM - 1:00 AM', ist(10, 59))).toBe(false);
    expect(isOutletOpenNow('11:30 AM - 12:30 AM', ist(0, 15))).toBe(true);
    expect(isOutletOpenNow('11:30 AM - 12:30 AM', ist(12, 0))).toBe(true);
  });

  test('unparseable timing returns null', () => {
    expect(isOutletOpenNow('Open daily')).toBeNull();
    expect(isOutletOpenNow(undefined)).toBeNull();
  });
});
