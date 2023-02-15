// index.tsx
import { Amplify, API, withSSRContext } from "aws-amplify";
import { GetServerSideProps } from "next";
import React from "react";
import styles from "../../styles/Home.module.css";
import {
  Todo,
  CreateTodoInput,
  CreateTodoMutation,
  ListTodosQuery,
  DeleteTodoInput,
} from "../API";
import { createTodo, deleteTodo } from "../graphql/mutations";
import { listTodos } from "../graphql/queries";
import { GRAPHQL_AUTH_MODE } from "@aws-amplify/api";
import { Authenticator, Button, Divider, Link } from "@aws-amplify/ui-react";
import awsExports from "../aws-exports";
import "@aws-amplify/ui-react/styles.css";
import { useState } from "react";
import EditModal from "../components/EditModal";

Amplify.configure({ ...awsExports, ssr: true });

// Getting all todos
export const getServerSideProps: GetServerSideProps = async ({ req }) => {
  const SSR = withSSRContext({ req });

  const response = (await SSR.API.graphql({
    query: listTodos,
    authMode: GRAPHQL_AUTH_MODE.API_KEY,
  })) as {
    auth;
    data: ListTodosQuery;
  };

  return {
    props: {
      todos: response.data.listTodos.items,
    },
  };
};

export default function Home({ todos = [] }: { todos: Todo[] }) {
  const [authUser, setAuthUser] = useState(null);
  const [todoToUpdate, setTodoToUpdate] = useState({});
  const [modal, setModal] = useState(false);

  //Creating a todo
  async function handleCreateTodo(event) {
    event.preventDefault();

    const form = new FormData(event.target);

    try {
      const createInput: CreateTodoInput = {
        name: form.get("title").toString(),
        description: form.get("content").toString(),
      };

      const request = (await API.graphql({
        authMode: GRAPHQL_AUTH_MODE.AMAZON_COGNITO_USER_POOLS,
        query: createTodo,
        variables: {
          input: createInput,
        },
      })) as { data: CreateTodoMutation; errors: any[] };
      location.reload();
    } catch ({ errors }) {
      console.error(...errors);
      throw new Error(errors[0].message);
    }
  }

  //Deleting a todo
  async function DeleteTodo(todoId) {
    try {
      const deleteInput: DeleteTodoInput = {
        id: todoId,
      };

      await API.graphql({
        authMode: GRAPHQL_AUTH_MODE.AMAZON_COGNITO_USER_POOLS,
        query: deleteTodo,
        variables: {
          input: deleteInput,
        },
      });
      location.reload();
    } catch ({ errors }) {
      console.error(...errors);
      throw new Error(errors[0].message);
    }
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Users Todos</h1>
      <div className={styles.grid}>
        {todos.map((todo) => (
          <div
            className={styles.card}
            key={todo.id}
            onMouseEnter={() => setTodoToUpdate(todo)}
          >
            <span className={styles.author}>&#9997;{todo.owner}</span>
            <h3>{todo.name}</h3>
            <p>{todo.description}</p>
            {authUser && authUser.username === todo.owner && (
              <div className={styles.ctrls}>
                <Button
                  size="small"
                  variation="primary"
                  onClick={() => {
                    setModal(true);
                  }}
                >
                  Edit
                </Button>
                <Button
                  size="small"
                  variation="destructive"
                  onClick={() => DeleteTodo(todo.id)}
                >
                  Delete
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>
      {/* The Edit todo component */}
      {modal && <EditModal setModal={setModal} todoId={todoToUpdate} />}
      <Divider orientation="horizontal" />
      <h2 className={styles.title}>
        {authUser
          ? `Hi ${authUser.username}, create your todos`
          : "Sign in to create a todo"}
      </h2>
      <Authenticator>
        {({ signOut, user }) => (
          <>
            {user && setAuthUser(user)}
            <form onSubmit={handleCreateTodo}>
              <fieldset>
                <legend>Title</legend>
                <input placeholder="Title" name="title" />
              </fieldset>

              <fieldset>
                <legend>Content</legend>
                <textarea placeholder="Describe your todo" name="content" />
              </fieldset>

              <button>Create Todo</button>
            </form>
            <main className={styles.footer}>
              <Button onClick={signOut} variation="warning">
                <Link href="/">Sign Out</Link>
              </Button>
            </main>
          </>
        )}
      </Authenticator>
    </div>
  );
}
