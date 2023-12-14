const express = require("express");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const DBP = path.join(__dirname, "todoApplication.db");
const format = require("date-fns/format");
const isMatch = require("date-fns/isMatch");
const isValid = require("date-fns/isValid");
const app = express();
app.use(express.json());

//database connection:
let DBC = null;

const initializingDBAndServer = async () => {
  try {
    DBC = await open({
      filename: DBP,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is Running at http://localhost:3000/");
    });
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};
initializingDBAndServer();

const hasStatusProperty = (requestQuery) => {
  return requestQuery.status !== undefined;
};

const hasPriorityProperty = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

const hasPriorityAndStatusProperty = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};

const hasSearchProperty = (requestQuery) => {
  return requestQuery.search_q !== undefined;
};

const hasCategoryAndStatusProperty = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.status !== undefined
  );
};

const hasCategoryProperty = (requestQuery) => {
  return requestQuery.category !== undefined;
};

const convertDBObjTOResponseObj = (DBObject) => {
  return {
    id: DBObject.id,
    todo: DBObject.todo,
    priority: DBObject.priority,
    status: DBObject.status,
    category: DBObject.category,
    dueDate: DBObject.due_date,
  };
};
//API-1:
//Get todo details using API with get method:

app.get("/todos/", async (request, response) => {
  let todoData = null;
  let getTodoListWithSqlQuery = "";
  const { search_q = "", status, priority, category } = request.query;

  //get data based requests through Switch case:
  switch (true) {
    //Scenario-1:
    case hasStatusProperty(request.query):
      if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
        getTodoListWithSqlQuery = `
                SELECT * FROM todo WHERE status = "${status}";
                `;
        todoData = await DBC.all(getTodoListWithSqlQuery);
        response.send(
          todoData.map((eachTodo) => convertDBObjTOResponseObj(eachTodo))
        );
      } else {
        //send invalid todo status:
        response.status(400);
        response.send("Invalid Todo Status");
      }
      break;
    //Scenario-2:
    case hasPriorityProperty(request.query):
      if (priority === "LOW" || priority === "MEDIUM" || priority === "HIGH") {
        getTodoListWithSqlQuery = `
              SELECT * FROM todo WHERE priority = "${priority}";
              `;
        todoData = await DBC.all(getTodoListWithSqlQuery);
        response.send(
          todoData.map((eachTodo) => convertDBObjTOResponseObj(eachTodo))
        );
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;

    //Scenario-3:
    case hasPriorityAndStatusProperty(request.query):
      if (priority === "LOW" || priority === "MEDIUM" || priority === "HIGH") {
        if (
          status === "TO DO" ||
          status === "IN PROGRESS" ||
          status === "DONE"
        ) {
          getTodoListWithSqlQuery = `
            SELECT * FROM todo WHERE priority = "${priority}" AND status = "${status}";
            `;
          todoData = await DBC.all(getTodoListWithSqlQuery);
          response.send(
            todoData.map((eachTodo) => convertDBObjTOResponseObj(eachTodo))
          );
        } else {
          //send invalid status message:
          response.status(400);
          response.send("Invalid Todo Status");
        }
      } else {
        //send invalid status property:
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;

    //Scenario-4:

    case hasSearchProperty(request.query):
      getTodoListWithSqlQuery = `
        SELECT * FROM todo WHERE todo LIKE "%${search_q}%";
        `;
      todoData = await DBC.all(getTodoListWithSqlQuery);
      response.send(
        todoData.map((eachTodo) => convertDBObjTOResponseObj(eachTodo))
      );
      break;
    // Scenario-5:
    case hasCategoryAndStatusProperty(request.query):
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        if (
          status === "TO DO" ||
          status === "IN PROGRESS" ||
          status === "DONE"
        ) {
          getTodoListWithSqlQuery = `
        SELECT * FROM todo WHERE category = "${category}" AND status = "${status}";
        `;
          todoData = await DBC.all(getTodoListWithSqlQuery);
          response.send(
            todoData.map((eachTodo) => convertDBObjTOResponseObj(eachTodo))
          );
        } else {
          response.status(400);
          response.send("Invalid Todo Status");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;

    //Scenario-6:

    case hasCategoryProperty(request.query):
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        getTodoListWithSqlQuery = `
          SELECT * FROM todo WHERE category = "${category}";
          `;
        todoData = await DBC.all(getTodoListWithSqlQuery);
        response.send(
          todoData.map((eachTodo) => convertDBObjTOResponseObj(eachTodo))
        );
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;

    //Scenario-7:

    case hasCategoryAndPriorityProperty(request.query):
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        if (
          priority === "LOW" ||
          priority === "MEDIUM" ||
          priority === "HIGH"
        ) {
          getTodoListWithSqlQuery = `
                SELECT * FROM todo WHERE category = "${category}" AND priority = "${priority}";
                `;
          todoData = await DBC.all(getTodoListWithSqlQuery);
          response.send(
            todoData.map((eachTodo) => convertDBObjTOResponseObj(eachTodo))
          );
        } else {
          response.status(400);
          response.send("Invalid Todo Priority");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;
    default:
      getTodoListWithSqlQuery = `
          SELECT * FROM todo;
          `;
      todoData = await DBC.all(getTodoListWithSqlQuery);
      response.send(
        todoData.map((eachTodo) => convertDBObjTOResponseObj(eachTodo))
      );
  }
});

//API-2:
// Get Specific todo based on todoId using API with GET method:

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getSpecificTodoWithSqlQuery = `
    SELECT * FROM todo WHERE id = "${todoId}";
    `;
  const todo = await DBC.get(getSpecificTodoWithSqlQuery);
  response.send(convertDBObjTOResponseObj(todo));
});

//API-3:

//Get specific todo based on dueDate using API with Get method:

app.get("/agenda/", async (request, response) => {
  const { date } = request.query;
  if (isMatch(date, "yyyy-MM-dd")) {
    const newDate = format(new Date(date), "yyyy-MM-dd");

    const getTodoListWithSqlQuery = `
    SELECT *
    FROM
    todo
    WHERE
    due_date = '${newDate}';
    `;
    const todoList = await DBC.all(getTodoListWithSqlQuery);
    response.send(
      todoList.map((eachItem) => convertDBObjTOResponseObj(eachItem))
    );
  } else {
    response.status(400);
    response.send("Invalid Due Date");
  }
});

//API-4:
// create todo using API with POST method:

app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status, category, dueDate } = request.body;
  if (priority === "LOW" || priority === "MEDIUM" || priority === "HIGH") {
    if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        if (isMatch(dueDate, "yyyy-MM-dd")) {
          const newDueDate = format(new Date(dueDate), "yyyy-MM-dd");
          const createTodoWithSqlQuery = `
              INSERT INTO todo(id, todo, priority, status, category, due_date)
              VALUES(
                  ${id},
                  '${todo}',
                  '${priority}',
                  '${status}',
                  '${category}',
                  '${newDueDate}'
              );
              `;
          await DBC.run(createTodoWithSqlQuery);
          response.send("Todo Successfully Added");
        } else {
          response.status(400);
          response.send("Invalid Due Date");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
    } else {
      response.status(400);
      response.send("Invalid Todo Status");
    }
  } else {
    response.status(400);
    response.send("Invalid Todo Priority");
  }
});

//API-5:
// update details of specific todo based on id using API with PUT method:

app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const requestBody = request.body;
  const getExistingTodoWithSqlQuery = `
  SELECT * FROM todo WHERE id = ${todoId};
  `;
  const existingTodo = await DBC.get(getExistingTodoWithSqlQuery);

  const {
    todo = existingTodo.todo,
    priority = existingTodo.priority,
    status = existingTodo.status,
    category = existingTodo.category,
    dueDate = existingTodo.dueDate,
  } = request.body;

  let updateTodoWithSqlQuery;
  switch (true) {
    //Scenario-2:

    case requestBody.priority !== undefined:
      if (priority === "LOW" || priority === "MEDIUM" || priority === "HIGH") {
        updateTodoWithSqlQuery = `
              UPDATE todo SET
              todo = '${todo}',
              priority = '${priority}',
              status = '${status}',
              category = '${category}',
              due_date = '${dueDate}'
              WHERE
              id = ${todoId};
              `;
        await DBC.run(updateTodoWithSqlQuery);
        response.send("Priority Updated");
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;

    //Scenario-1:

    case requestBody.status !== undefined:
      if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
        updateTodoWithSqlQuery = `
              UPDATE todo SET
              todo = '${todo}',
              priority = '${priority}',
              status = '${status}',
              category = '${category}',
              due_date = '${dueDate}'
              WHERE
              id = ${todoId};
              `;
        await DBC.run(updateTodoWithSqlQuery);
        response.send("Status Updated");
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }
      break;

    case requestBody.category !== undefined:
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        updateTodoWithSqlQuery = `
              UPDATE todo SET
              todo = '${todo}',
              priority = '${priority}',
              status = '${status}',
              category = '${category}',
              due_date = '${dueDate}'
              WHERE
              id = ${todoId};
              `;
        await DBC.run(updateTodoWithSqlQuery);
        response.send("Category Updated");
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;

    case requestBody.dueDate !== undefined:
      if (isMatch(dueDate, "yyyy-MM-dd")) {
        const newDueDate = format(new Date(dueDate), "yyyy-MM-dd");
        updateTodoWithSqlQuery = `
              UPDATE todo SET
              todo = '${todo}',
              priority = '${priority}',
              status = '${status}',
              category = '${category}',
              due_date = '${newDueDate}'
              WHERE
              id = ${todoId};
              `;
        await DBC.run(updateTodoWithSqlQuery);
        response.send("Due Date Updated");
      } else {
        response.status(400);
        response.send("Invalid Due Date");
      }
      break;

    case requestBody.todo !== undefined:
      updateTodoWithSqlQuery = `
              UPDATE todo SET
              todo = '${todo}',
              priority = '${priority}',
              status = '${status}',
              category = '${category}',
              due_date = '${dueDate}'
              WHERE
              id = ${todoId};
              `;
      await DBC.run(updateTodoWithSqlQuery);
      response.send("Todo Updated");

      break;
  }
});

//API-6:
//delete specific todo based on Id using API with DELETE method:

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteSpecificTodoWithSqlQuery = `
    DELETE
    FROM
    todo
    WHERE
    id = ${todoId};
    `;
  await DBC.run(deleteSpecificTodoWithSqlQuery);
  response.send("Todo Deleted");
});

module.exports = app;
