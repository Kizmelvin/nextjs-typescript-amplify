import { GRAPHQL_AUTH_MODE } from "@aws-amplify/auth";
import { Button } from "@aws-amplify/ui-react";
import { API } from "aws-amplify";
import { UpdateTodoInput, UpdateTodoMutation } from "../API";
import { updateTodo } from "../graphql/mutations";

function EditModal({ todoId, setModal }) {
  const { id, title, description } = todoId;

  async function handleUpdateTodo(ev) {
    const form = new FormData(ev.target);

    try {
      const updateInput: UpdateTodoInput = {
        id: id,
        name: form.get("title").toString(),
        description: form.get("content").toString(),
      };

      const request = (await API.graphql({
        authMode: GRAPHQL_AUTH_MODE.AMAZON_COGNITO_USER_POOLS,
        query: updateTodo,
        variables: {
          input: updateInput,
        },
      })) as { data: UpdateTodoMutation; errors: any[] };

      location.reload();
    } catch ({ errors }) {
      console.error(...errors);
      throw new Error(errors[0].message);
    }
  }

  return (
    <form onSubmit={handleUpdateTodo}>
      <Button variation="destructive" onClick={() => setModal(false)}>
        Close
      </Button>

      <fieldset>
        <legend>Title</legend>
        <input defaultValue={title} name="title" />
      </fieldset>

      <fieldset>
        <legend>Content</legend>
        <textarea defaultValue={description} name="content" />
      </fieldset>

      <button>Update Todo</button>
    </form>
  );
}

export default EditModal;
