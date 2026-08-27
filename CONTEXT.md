# Delivery Quoting

Prices the delivery of a single order from a few facts about that order. Stateless: every quote is computed from the request alone.

## Language

**Quote**:
The priced answer for one order: a total delivery fee plus its breakdown.
_Avoid_: Estimate, price, rate

**Base fee**:
The part of the fee set by the delivery distance band. Free delivery reduces it to zero.
_Avoid_: Distance fee, shipping cost

**Free delivery**:
The rule that the base fee is zero when the order subtotal reaches the free-delivery threshold. It never removes surcharges.
_Avoid_: Free shipping, waiver

**Surcharge**:
An amount added on top of the base fee because of a property of the order (service level, weight, order size, delivery window). Surcharges always apply, even with free delivery.
_Avoid_: Extra, fee add-on, premium

**Service level**:
How fast the order is delivered: standard or rush. Rush carries a surcharge.
_Avoid_: Tier, speed, priority

**Delivery window**:
The time slot the customer asks for the delivery to arrive in. Some windows carry a surcharge.
_Avoid_: Slot, schedule, time band

**Small order**:
An order whose subtotal is below the small-order floor. It carries a surcharge.
_Avoid_: Minimum order, under-minimum

**Breakdown**:
The list of lines that make up a quote's total. Only lines that apply are listed, and they always sum to the total.
_Avoid_: Itemisation, details, components

**Line**:
One named amount in a breakdown: the base fee or one surcharge.
_Avoid_: Item, entry, component

**Rules**:
The published table of thresholds and amounts the quote is computed from.
_Avoid_: Config, pricing table, tariff
