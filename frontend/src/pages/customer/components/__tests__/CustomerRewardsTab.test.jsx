import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import CustomerRewardsTab from '../CustomerRewardsTab';

jest.mock('../../../../lib/config', () => '');

global.IS_REACT_ACT_ENVIRONMENT = true;

const profile = {
  uid: 'u1',
  name: 'Test Patron',
  coins_history: [
    { amount: 50, type: 'credit', reason: 'Welcome Joining Bonus', timestamp: '2026-11-20T10:00:00+05:30' },
    { type: 'earned', coins: 12, note: '5% PD Coins earned on Total Bill #ABC', timestamp: '2026-11-22T10:00:00+05:30' },
    { type: 'redeemed', coins: 20, note: 'Online order #XYZ', timestamp: '2026-11-23T10:00:00+05:30' },
  ],
};

let container;
let root;

const render = (props) => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => { root.render(<CustomerRewardsTab {...props} />); });
};

const text = () => container.textContent;
// Exact text first, then the first button whose text starts with it (list rows hold title + description)
const byText = (t) =>
  Array.from(container.querySelectorAll('button, div, h5')).find((el) => el.textContent.trim() === t) ||
  Array.from(container.querySelectorAll('button')).find((el) => el.textContent.trim().toLowerCase().startsWith(t.toLowerCase()));
const click = (el) => act(() => { el.dispatchEvent(new MouseEvent('click', { bubbles: true })); });

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  delete global.fetch;
});

describe('CustomerRewardsTab', () => {
  test('shows server balance and has no fake coin-earning actions', () => {
    render({ customerProfile: profile, pdCoins: 42 });
    expect(text()).toContain('42');
    expect(text()).not.toMatch(/Claim \+25|100 Coins \/ Invite|50 Coins \/ Review|Vouchers|DARBAR-ROYAL-100/);
  });

  test('passbook lists real coins_history newest first, no hardcoded entries', () => {
    render({ customerProfile: profile, pdCoins: 42 });
    click(byText('Activity'));
    const amounts = (text().match(/[+-]\d+ Coins/g) || []);
    expect(amounts).toEqual(['-20 Coins', '+12 Coins', '+50 Coins']);
    expect(text()).not.toMatch(/Mutton Biryani Order Cash Back/);
  });

  test('empty passbook shows empty state', () => {
    render({ customerProfile: {}, pdCoins: 0 });
    click(byText('Activity'));
    expect(text()).toMatch(/No coin activity yet/);
  });

  test('review is posted to the backend and balance is unchanged', async () => {
    global.fetch = jest.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve({}) }));
    render({ customerProfile: profile, pdCoins: 42, currentUser: { uid: 'u1', displayName: 'Test Patron' } });
    click(byText('Rate Us'));

    const textarea = container.querySelector('textarea');
    const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
    act(() => {
      setter.call(textarea, 'Amazing biryani and service');
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await act(async () => {
      container.querySelector('form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    });

    expect(global.fetch).toHaveBeenCalledWith('/api/reviews', expect.objectContaining({ method: 'POST' }));
    const body = JSON.parse(global.fetch.mock.calls[0][1].body);
    expect(body).toMatchObject({ name: 'Test Patron', text: 'Amazing biryani and service', customer_uid: 'u1' });
    expect(text()).toMatch(/will appear after approval/);
    expect(text()).toContain('42');
  });

  test('short review shows validation error and is not sent', async () => {
    global.fetch = jest.fn();
    render({ customerProfile: profile, pdCoins: 42 });
    click(byText('Rate Us'));
    await act(async () => {
      container.querySelector('form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    });
    expect(global.fetch).not.toHaveBeenCalled();
    expect(text()).toMatch(/at least 10 characters/);
  });
});
