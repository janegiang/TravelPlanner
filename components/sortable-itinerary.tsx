"use client";

import { useEffect, useId, useState } from "react";
import Link from "next/link";

import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  closestCorners,
  pointerWithin,
  rectIntersection,
  useDroppable,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";

import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";

import { CSS } from "@dnd-kit/utilities";

import {
  AlertTriangle,
  CalendarDays,
  Clock3,
  GripVertical,
  MapPin,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
  NotebookPen,
} from "lucide-react";

import type { Location } from "@/app/generated/prisma/client";

import { reorderItinerary } from "@/lib/actions/reorder-itinerary";
import type { PendingLocationMove } from "@/lib/actions/update-location";

import { formatTripDate, getTripDuration } from "@/lib/trip-dates";

import {
  preserveManualOrder,
  findActivityTimeConflict,
  timeInMinutes,
} from "@/lib/itinerary-sort";

import { Button } from "@/components/ui/button";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import EditLocationDialog from "@/components/edit-location-dialog";
import DeleteLocationDialog from "@/components/delete-location-dialog";

// ======================================
// TYPES
// ======================================

interface SortableItineraryProps {
  locations: Location[];
  tripId: string;
  startDate: Date | string;
  endDate: Date | string;
}

interface SortableItemProps {
  item: Location;
  index: number;
  disabled: boolean;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

interface DayGroup {
  dayNumber: number | null;
  title: string;
  dateLabel: string;
  locations: Location[];
}

interface LocationUpdate {
  id: string;
  dayNumber: number | null;
  order: number;
}

interface TimeConflict {
  draggedLocation: Location;
  conflictingLocation: Location;
  pendingMove: PendingLocationMove;
}

// ======================================
// HELPERS
// ======================================

function groupId(dayNumber: number | null) {
  return dayNumber === null ? "day-unscheduled" : `day-${dayNumber}`;
}

function formatTime(time: string | null) {
  if (!time) return null;

  const [hours, minutes] = time.split(":").map(Number);

  const period = hours >= 12 ? "PM" : "AM";
  const displayHour = hours % 12 || 12;

  return `${displayHour}:${String(minutes).padStart(2, "0")} ${period}`;
}

/**
 * When dropping onto a day container, find a
 * chronological position for the dragged activity.
 *
 * Existing untimed activities keep their positions.
 *
 * An untimed dragged activity is appended to the
 * destination day.
 */
function findChronologicalInsertIndex(
  locations: Location[],
  targetDay: number | null,
  draggedLocation: Location,
): number {
  const draggedTime = timeInMinutes(draggedLocation.startTime);

  const targetLocations = locations.filter(
    (location) => location.dayNumber === targetDay,
  );

  const lastTargetIndex = locations.findLastIndex(
    (location) => location.dayNumber === targetDay,
  );

  const appendIndex =
    lastTargetIndex >= 0 ? lastTargetIndex + 1 : locations.length;

  if (draggedTime === null) {
    return appendIndex;
  }

  const nextTimedLocation = targetLocations.find((location) => {
    const time = timeInMinutes(location.startTime);

    return time !== null && time > draggedTime;
  });

  if (nextTimedLocation) {
    return locations.findIndex(
      (location) => location.id === nextTimedLocation.id,
    );
  }

  return appendIndex;
}

/**
 * Calculate the exact zero-based position
 * of the dragged location within its destination day.
 *
 * This is important because the server action
 * expects a day-relative targetIndex.
 */
function getTargetIndex(
  locations: Location[],
  draggedId: string,
  targetDay: number | null,
): number {
  const dayLocations = locations.filter(
    (location) => location.dayNumber === targetDay,
  );

  return dayLocations.findIndex((location) => location.id === draggedId);
}

// ======================================
// DRAG PREVIEW
// ======================================

function LocationDragPreview({ item }: { item: Location }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border-2 border-brand-orange bg-white p-4 shadow-2xl">
      <GripVertical className="h-5 w-5 text-brand-olive" />

      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-cream">
        <MapPin className="h-5 w-5 text-brand-orange" />
      </div>

      <div className="min-w-0">
        <h3 className="truncate font-semibold text-brand-ink">
          {item.locationTitle}
        </h3>

        {item.startTime && (
          <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
            <Clock3 className="h-3.5 w-3.5" />
            {formatTime(item.startTime)}
          </p>
        )}
      </div>
    </div>
  );
}

// ======================================
// SORTABLE LOCATION CARD
// ======================================

function SortableItem({
  item,
  index,
  disabled,
  onEdit,
  onDelete,
}: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: item.id,
    disabled,
    data: {
      type: "location",
      dayNumber: item.dayNumber,
    },
  });

  return (
    <div
      id={`location-${item.id}`}
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        touchAction: "pan-y",
      }}
      className={`scroll-mt-28 flex cursor-grab items-center gap-3 rounded-xl border bg-white p-4 transition-all active:cursor-grabbing ${
        isDragging
          ? "border-brand-orange opacity-30"
          : "border-border hover:border-brand-gold hover:shadow-md"
      } ${disabled ? "cursor-not-allowed opacity-60" : ""}`}
    >
      {/* Drag Handle */}
      <div className="shrink-0 text-muted-foreground">
        <GripVertical className="h-5 w-5" />
      </div>

      {/* Stop Number */}
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-cream font-bold text-brand-orange">
        {index + 1}
      </div>

      {/* Location Details */}
      <div className="min-w-0 flex-1">
        <h3 className="truncate font-semibold text-foreground">
          {item.locationTitle}
        </h3>

        <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          {item.startTime && (
            <span className="flex items-center gap-1">
              <Clock3 className="h-3.5 w-3.5" />
              {formatTime(item.startTime)}
            </span>
          )}
        </div>

        {item.notes && (
          <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <NotebookPen className="h-3.5 w-3.5" />
              {item.notes}
            </span>
          </p>
        )}
      </div>

      {/* Edit / Delete Menu */}
      <div
        className="shrink-0"
        onPointerDown={(event) => event.stopPropagation()}
        onTouchStart={(event) => event.stopPropagation()}
        onKeyDown={(event) => event.stopPropagation()}
      >
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              disabled={disabled}
              aria-label={`Actions for ${item.locationTitle}`}
            >
              <MoreHorizontal className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            align="end"
            sideOffset={6}
            className="w-44 rounded-xl border border-border !bg-white p-1.5 shadow-lg"
          >
            <DropdownMenuItem
              onSelect={() => onEdit(item.id)}
              className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-brand-ink hover:!bg-brand-gold focus:!bg-brand-gold focus:!text-brand-ink"
            >
              <Pencil className="h-4 w-4 shrink-0" />
              <span>Edit Location</span>
            </DropdownMenuItem>

            <DropdownMenuItem
              onSelect={() => onDelete(item.id)}
              className={
                "flex cursor-pointer items-center gap-2 " +
                "rounded-lg px-3 py-2.5 text-sm " +
                "!text-destructive " +
                "hover:!bg-brand-gold " +
                "hover:!text-destructive " +
                "focus:!bg-brand-gold " +
                "focus:!text-destructive " +
                "data-[highlighted]:!bg-brand-gold " +
                "data-[highlighted]:!text-destructive"
              }
            >
              <Trash2 className="h-4 w-4 shrink-0" />
              <span>Delete Location</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

// ======================================
// DROPPABLE DAY SECTION
// ======================================

function DaySection({
  group,
  disabled,
  activeLocation,
  onEdit,
  onDelete,
}: {
  group: DayGroup;
  disabled: boolean;
  activeLocation: Location | null;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const id = groupId(group.dayNumber);

  const { setNodeRef, isOver } = useDroppable({
    id,
    disabled,
    data: {
      type: "day",
      dayNumber: group.dayNumber,
    },
  });

  const isTarget =
    isOver &&
    activeLocation !== null &&
    activeLocation.dayNumber !== group.dayNumber;

  return (
    <div
      ref={setNodeRef}
      className={`overflow-hidden rounded-2xl border bg-background shadow-sm transition-all ${
        isTarget
          ? "border-brand-orange ring-2 ring-brand-orange/40"
          : "border-border"
      }`}
    >
      {/* Day Header */}
      <div
        className={`flex items-center gap-3 border-b p-4 transition-colors ${
          isTarget
            ? "border-brand-orange/30 bg-brand-gold/40"
            : "border-border bg-secondary"
        }`}
      >
        <CalendarDays className="h-5 w-5 text-primary" />

        <div className="flex-1">
          <h3 className="font-semibold text-foreground">{group.title}</h3>

          <p className="text-sm text-muted-foreground">
            {group.dateLabel} · {group.locations.length}{" "}
            {group.locations.length === 1 ? "activity" : "activities"}
          </p>
        </div>

        {isTarget && (
          <span className="rounded-full bg-brand-orange px-3 py-1 text-xs font-semibold text-white">
            Drop here
          </span>
        )}
      </div>

      {/* Location Cards */}
      <SortableContext
        items={group.locations.map((location) => location.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-3 p-4">
          {group.locations.length === 0 ? (
            <div
              className={`rounded-xl border border-dashed p-8 text-center text-sm transition-colors ${
                isTarget
                  ? "border-brand-orange bg-brand-gold/20 text-brand-ink"
                  : "border-border bg-background text-muted-foreground"
              }`}
            >
              {isTarget
                ? "Release to add this location"
                : "No activities planned for this day. Drag a location here."}
            </div>
          ) : (
            group.locations.map((location, index) => (
              <SortableItem
                key={location.id}
                item={location}
                index={index}
                disabled={disabled}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))
          )}
        </div>
      </SortableContext>
    </div>
  );
}

// ======================================
// MAIN ITINERARY COMPONENT
// ======================================

export default function SortableItinerary({
  locations,
  tripId,
  startDate,
  endDate,
}: SortableItineraryProps) {
  const id = useId();

  const duration = getTripDuration(startDate, endDate);

  const [localLocations, setLocalLocations] = useState(() =>
    preserveManualOrder(locations, duration),
  );

  const [activeId, setActiveId] = useState<string | null>(null);

  const [editingLocationId, setEditingLocationId] = useState<string | null>(
    null,
  );

  const [deletingLocationId, setDeletingLocationId] = useState<string | null>(
    null,
  );

  const [focusTimeOnEdit, setFocusTimeOnEdit] = useState(false);

  const [timeConflict, setTimeConflict] = useState<TimeConflict | null>(null);

  // Remember the original requested drag.
  const [pendingMove, setPendingMove] = useState<PendingLocationMove | null>(
    null,
  );

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ======================================
  // SYNC SERVER DATA
  // ======================================

  useEffect(() => {
    setLocalLocations(preserveManualOrder(locations, duration));
  }, [locations, duration]);

  // ======================================
  // DRAG SENSORS
  // ======================================

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const activeLocation =
    localLocations.find((location) => location.id === activeId) ?? null;

  const editingLocation =
    localLocations.find((location) => location.id === editingLocationId) ??
    null;

  const deletingLocation =
    localLocations.find((location) => location.id === deletingLocationId) ??
    null;

  // ======================================
  // GROUP LOCATIONS BY DAY
  // ======================================

  const groups: DayGroup[] = [];

  for (let day = 1; day <= duration; day++) {
    const dayLocations = localLocations.filter(
      (location) => location.dayNumber === day,
    );

    const date = new Date(startDate);

    date.setUTCDate(date.getUTCDate() + day - 1);

    groups.push({
      dayNumber: day,
      title: `Day ${day}`,
      dateLabel: formatTripDate(date),
      locations: dayLocations,
    });
  }

  groups.push({
    dayNumber: null,
    title: "Unscheduled",
    dateLabel: "Locations without an assigned day",
    locations: localLocations.filter((location) => location.dayNumber === null),
  });

  // ======================================
  // COLLISION DETECTION
  // ======================================

  const collisionDetection: CollisionDetection = (args) => {
    const pointerCollisions = pointerWithin(args);

    if (pointerCollisions.length > 0) {
      const locationCollisions = pointerCollisions.filter(
        (collision) =>
          args.droppableContainers.find(
            (container) => container.id === collision.id,
          )?.data.current?.type === "location",
      );

      if (locationCollisions.length > 0) {
        return locationCollisions;
      }

      return pointerCollisions;
    }

    const rectangleCollisions = rectIntersection(args);

    if (rectangleCollisions.length > 0) {
      return rectangleCollisions;
    }

    return closestCorners(args);
  };

  function handleDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id));
    setError(null);
  }

  function handleDragCancel() {
    setActiveId(null);
  }

  // ======================================
  // SAVE VALID MANUAL ORDER
  // ======================================

  async function saveLocations(nextLocations: Location[]) {
    const previousLocations = localLocations;

    const normalizedLocations = preserveManualOrder(nextLocations, duration);

    const changed = normalizedLocations.some((location) => {
      const previous = previousLocations.find(
        (item) => item.id === location.id,
      );

      return (
        previous?.dayNumber !== location.dayNumber ||
        previous?.order !== location.order
      );
    });

    if (!changed) return;

    setLocalLocations(normalizedLocations);
    setIsSaving(true);
    setError(null);

    const updates: LocationUpdate[] = normalizedLocations.map((location) => ({
      id: location.id,
      dayNumber: location.dayNumber,
      order: location.order,
    }));

    try {
      await reorderItinerary(tripId, updates);
    } catch (error) {
      setLocalLocations(previousLocations);

      setError(
        error instanceof Error
          ? error.message
          : "Could not save the new itinerary order.",
      );

      console.error("Failed to update itinerary:", error);
    } finally {
      setIsSaving(false);
    }
  }

  // ======================================
  // DRAG AND DROP
  // ======================================

  async function handleDragEnd(event: DragEndEvent) {
    setActiveId(null);

    const { active, over } = event;

    if (!over || isSaving || timeConflict) return;

    const draggedLocation = localLocations.find(
      (location) => location.id === active.id,
    );

    if (!draggedLocation) return;

    const targetId = String(over.id);

    let targetDay: number | null;
    let targetLocationId: string | null = null;

    // Determine destination day or card.
    if (targetId.startsWith("day-")) {
      const day = targetId.replace("day-", "");

      targetDay = day === "unscheduled" ? null : Number(day);
    } else {
      const targetLocation = localLocations.find(
        (location) => location.id === targetId,
      );

      if (!targetLocation) return;

      targetDay = targetLocation.dayNumber;
      targetLocationId = targetLocation.id;
    }

    if (
      targetDay !== null &&
      (!Number.isInteger(targetDay) || targetDay < 1 || targetDay > duration)
    ) {
      return;
    }

    if (targetLocationId === draggedLocation.id) {
      return;
    }

    // Remove dragged location.
    const remaining = localLocations.filter(
      (location) => location.id !== draggedLocation.id,
    );

    const movedLocation = {
      ...draggedLocation,
      dayNumber: targetDay,
    };

    let insertIndex: number;

    // ======================================
    // CASE 1: DROP ONTO LOCATION CARD
    // ======================================

    if (targetLocationId) {
      const targetIndex = remaining.findIndex(
        (location) => location.id === targetLocationId,
      );

      if (targetIndex < 0) return;

      const originalIndex = localLocations.findIndex(
        (location) => location.id === draggedLocation.id,
      );

      const originalTargetIndex = localLocations.findIndex(
        (location) => location.id === targetLocationId,
      );

      const isMovingDown = originalIndex < originalTargetIndex;

      // Downward: insert after target.
      // Upward: insert before target.
      insertIndex = isMovingDown ? targetIndex + 1 : targetIndex;
    }

    // ======================================
    // CASE 2: DROP ONTO DAY CONTAINER
    // ======================================
    else {
      insertIndex = findChronologicalInsertIndex(
        remaining,
        targetDay,
        movedLocation,
      );
    }

    // Build requested order.
    const requestedLocations = [...remaining];

    requestedLocations.splice(insertIndex, 0, movedLocation);

    const requestedWithOrder = requestedLocations.map((location, index) => ({
      ...location,
      order: index,
    }));

    // ======================================
    // CALCULATE EXACT DESTINATION
    // ======================================

    const targetIndex = getTargetIndex(
      requestedWithOrder,
      draggedLocation.id,
      targetDay,
    );

    if (targetIndex < 0) return;

    const requestedMove: PendingLocationMove = {
      targetDay,
      targetIndex,
    };

    // ======================================
    // CHECK ACTIVITY TIME CONFLICT
    // ======================================

    const conflict = findActivityTimeConflict(
      requestedWithOrder,
      draggedLocation.id,
      targetDay,
    );

    if (conflict) {
      setTimeConflict({
        draggedLocation: conflict.draggedLocation,
        conflictingLocation: conflict.conflictingLocation,
        pendingMove: requestedMove,
      });

      // Do not save yet.
      return;
    }

    // ======================================
    // SAVE VALID DRAG
    // ======================================

    await saveLocations(requestedWithOrder);
  }

  // ======================================
  // CONFLICT DIALOG ACTIONS
  // ======================================

  function handleKeepTimeOrder() {
    // Discard the requested drag.
    setTimeConflict(null);
    setPendingMove(null);
  }

  function handleAdjustTime() {
    if (!timeConflict) return;

    const locationId = timeConflict.draggedLocation.id;

    // Remember the original destination.
    setPendingMove(timeConflict.pendingMove);

    // Close the warning first.
    setTimeConflict(null);

    // Open Edit Location.
    setFocusTimeOnEdit(true);
    setEditingLocationId(locationId);
  }

  function handleNormalEdit(locationId: string) {
    setPendingMove(null);
    setFocusTimeOnEdit(false);
    setEditingLocationId(locationId);
  }

  // ======================================
  // ADD LOCATION NAVIGATION
  // ======================================

  function handleAddLocation() {
    sessionStorage.setItem(
      `trip-${tripId}-itinerary-scroll`,
      String(window.scrollY),
    );
  }

  // ======================================
  // RENDER
  // ======================================

  return (
    <div className="space-y-5">
      {/* Error Message */}
      {error && (
        <div
          role="alert"
          className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
        >
          {error}
        </div>
      )}

      {/* Saving Indicator */}
      {isSaving && (
        <p role="status" className="text-sm font-medium text-primary">
          Saving itinerary changes...
        </p>
      )}

      {/* ====================================== */}
      {/* DRAGGABLE DAY GROUPS */}
      {/* ====================================== */}

      <DndContext
        id={id}
        sensors={sensors}
        collisionDetection={collisionDetection}
        onDragStart={handleDragStart}
        onDragCancel={handleDragCancel}
        onDragEnd={handleDragEnd}
      >
        <div className="space-y-5">
          {groups.map((group) => (
            <DaySection
              key={group.dayNumber ?? "unscheduled"}
              group={group}
              disabled={
                isSaving || timeConflict !== null || editingLocationId !== null
              }
              activeLocation={activeLocation}
              onEdit={handleNormalEdit}
              onDelete={setDeletingLocationId}
            />
          ))}
        </div>

        <DragOverlay>
          {activeLocation ? (
            <LocationDragPreview item={activeLocation} />
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* ====================================== */}
      {/* ADD LOCATION BUTTON */}
      {/* ====================================== */}

      <div className="flex justify-center pt-4">
        <Link
          href={`/trips/${tripId}/itinerary/new`}
          onClick={handleAddLocation}
        >
          <Button
            type="button"
            className="gap-2 bg-brand-orange text-white hover:bg-brand-orange/90 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Add Location
          </Button>
        </Link>
      </div>

      {/* ====================================== */}
      {/* ACTIVITY TIME CONFLICT DIALOG */}
      {/* ====================================== */}

      <AlertDialog
        open={timeConflict !== null}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            setTimeConflict(null);
          }
        }}
      >
        <AlertDialogContent className="max-w-md rounded-2xl border border-brand-olive/30 !bg-background p-6 text-brand-ink shadow-2xl">
          <AlertDialogHeader className="text-left">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-gold/30">
                <AlertTriangle className="h-6 w-6 text-brand-orange" />
              </div>

              <AlertDialogTitle className="text-xl font-bold text-brand-ink">
                Activity Time Conflict
              </AlertDialogTitle>
            </div>

            <AlertDialogDescription className="mt-3 text-sm leading-relaxed text-muted-foreground">
              <span className="font-semibold text-brand-ink">
                {timeConflict?.draggedLocation.locationTitle} (
                {formatTime(timeConflict?.draggedLocation.startTime ?? null)})
              </span>{" "}
              cannot be placed in the requested position relative to{" "}
              <span className="font-semibold text-brand-ink">
                {timeConflict?.conflictingLocation.locationTitle} (
                {formatTime(
                  timeConflict?.conflictingLocation.startTime ?? null,
                )}
                )
              </span>
              .
            </AlertDialogDescription>
          </AlertDialogHeader>

          <p className="text-sm text-brand-ink">
            Adjust the time to complete your move.
          </p>

          <AlertDialogFooter className="gap-3 border-t border-brand-olive/20 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleKeepTimeOrder}
              className="gap-2 border-brand-olive/40 bg-white text-brand-ink hover:bg-brand-gold"
            >
              Keep Time Order
            </Button>

            <Button
              type="button"
              onClick={handleAdjustTime}
              className="gap-2 bg-brand-orange text-white hover:bg-brand-orange/90"
            >
              <Clock3 className="h-4 w-4" />
              Adjust Time
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ====================================== */}
      {/* EDIT LOCATION DIALOG */}
      {/* ====================================== */}

      {editingLocation && (
        <EditLocationDialog
          key={editingLocation.id}
          location={editingLocation}
          tripId={tripId}
          startDate={startDate}
          endDate={endDate}
          open={editingLocationId !== null}
          focusTime={focusTimeOnEdit}
          pendingMove={pendingMove}
          onOpenChange={(nextOpen) => {
            if (!nextOpen) {
              setEditingLocationId(null);
              setFocusTimeOnEdit(false);
              setPendingMove(null);
            }
          }}
        />
      )}

      {/* ====================================== */}
      {/* DELETE LOCATION DIALOG */}
      {/* ====================================== */}

      {deletingLocation && (
        <DeleteLocationDialog
          key={deletingLocation.id}
          location={deletingLocation}
          tripId={tripId}
          open={deletingLocationId !== null}
          onOpenChange={(nextOpen) => {
            if (!nextOpen) {
              setDeletingLocationId(null);
            }
          }}
        />
      )}
    </div>
  );
}
