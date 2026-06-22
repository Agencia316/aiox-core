'use client';

import { useEffect, useState } from 'react';
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
} from '@dnd-kit/core';
import { api } from '@/components/api-client';

function DraggableCard({ card }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `card-${card.id}`,
    data: { card },
  });
  return (
    <div
      ref={setNodeRef}
      className={`kcard ${isDragging ? 'dragging' : ''}`}
      {...attributes}
      {...listeners}
    >
      <div className="name">{card.contact_name || card.phone}</div>
      <div className="phone">{card.phone}</div>
    </div>
  );
}

function DroppableColumn({ column, children }) {
  const { setNodeRef, isOver } = useDroppable({
    id: `col-${column.id}`,
    data: { column },
  });
  return (
    <div
      ref={setNodeRef}
      className="column"
      style={isOver ? { outline: '2px solid var(--primary)' } : undefined}
    >
      <header>
        <span>{column.name}</span>
        <span className="muted" style={{ fontWeight: 400 }}>
          {column.cards?.length || 0}
        </span>
      </header>
      <div className="body">{children}</div>
    </div>
  );
}

export default function KanbanBoard() {
  const [board, setBoard] = useState([]);
  const [err, setErr] = useState(null);
  const [empty, setEmpty] = useState(false);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  async function load() {
    try {
      const data = await api.board();
      setBoard(data);
      setEmpty(data.length === 0);
    } catch (e) {
      setErr(e.message);
    }
  }

  useEffect(() => {
    load();
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
  }, []);

  async function onInit() {
    setErr(null);
    try {
      await api.initBoard();
      await load();
    } catch (e) {
      setErr(e.message);
    }
  }

  async function onDragEnd(event) {
    const { active, over } = event;
    if (!over) return;
    const fromColumnId = active.data.current?.card?.column_id;
    const target = over.data.current?.column;
    if (!target || target.id === fromColumnId) return;
    const cardId = active.data.current?.card?.id;
    if (!cardId) return;
    try {
      await api.moveCard(cardId, target.name);
      await load();
    } catch (e) {
      setErr(e.message);
    }
  }

  return (
    <div className="stack">
      <h1 className="h1">Kanban</h1>
      {err && <div className="error">{err}</div>}
      {empty ? (
        <div className="card">
          <p className="muted" style={{ marginTop: 0 }}>
            Nenhuma coluna configurada ainda. Crie o board padrão (Novo / Em atendimento /
            Aguardando cliente / Fechado).
          </p>
          <button onClick={onInit} type="button">
            Inicializar board
          </button>
        </div>
      ) : (
        <DndContext sensors={sensors} onDragEnd={onDragEnd}>
          <div className="kanban">
            {board.map((col) => (
              <DroppableColumn key={col.id} column={col}>
                {(col.cards || []).map((card) => (
                  <DraggableCard key={card.id} card={card} />
                ))}
                {(!col.cards || col.cards.length === 0) && (
                  <div className="muted" style={{ fontSize: 12 }}>
                    vazio
                  </div>
                )}
              </DroppableColumn>
            ))}
          </div>
        </DndContext>
      )}
    </div>
  );
}
