(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.TodoTasks = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, () => {
  function moveIncomplete(tasks, sourceDate, targetDate, { createId = () => globalThis.crypto.randomUUID(), now = Date.now() } = {}) {
    if (sourceDate === targetDate) return { tasks, movedCount: 0 };
    let movedCount = 0;
    const result = tasks.flatMap((task) => {
      if (task.date !== sourceDate || task.done || task.routineId || task.planId || task.subtasks?.some((sub) => sub.routineId)) return [task];
      const subtasks = task.subtasks || [];
      const incomplete = subtasks.filter((sub) => !sub.done);
      // A retained card with only completed subtasks must stay on its original day.
      if (subtasks.length && !incomplete.length) return [task];
      movedCount++;
      const completed = subtasks.filter((sub) => sub.done);
      if (!completed.length) return [{ ...task, date: targetDate, updatedAt: now }];
      return [
        { ...task, subtasks: completed, updatedAt: now },
        { ...task, id: createId(), date: targetDate, subtasks: incomplete, createdAt: now, updatedAt: now },
      ];
    });
    return { tasks: result, movedCount };
  }

  return { moveIncomplete };
});
