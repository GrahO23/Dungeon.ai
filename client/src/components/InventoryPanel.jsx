function itemName(item) {
  return typeof item === 'string' ? item : item.name
}

function itemQty(item) {
  return typeof item === 'string' ? null : item.qty
}

function isConsumable(item) {
  return typeof item === 'object' && item.type === 'consumable'
}

export function InventoryPanel({ inventory, onUseItem, disabled }) {
  if (!inventory?.length) {
    return (
      <div className="inventory-panel">
        <p className="inventory-empty">No items.</p>
      </div>
    )
  }

  return (
    <ul className="inventory-panel">
      {inventory.map((item, i) => {
        const name = itemName(item)
        const qty = itemQty(item)
        return (
          <li key={`${name}-${i}`} className="inventory-item">
            <span>
              {name}
              {qty > 1 ? ` x${qty}` : ''}
            </span>
            {isConsumable(item) && (
              <button type="button" disabled={disabled} onClick={() => onUseItem(name)}>
                Use
              </button>
            )}
          </li>
        )
      })}
    </ul>
  )
}
