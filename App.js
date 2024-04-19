// Import React, Amplify UI components, GraphQL operations, and Amplify storage functions
import React, { useState, useEffect } from "react";
import "./App.css";
import "@aws-amplify/ui-react/styles.css";
import {
  Button,
  Flex,
  Heading,
  Text,
  TextField,
  Image,
  View,
  withAuthenticator,
  Link,
  Card,
  Divider,
} from "@aws-amplify/ui-react";
import { listNotes } from "./graphql/queries";
import { createNote as createNoteMutation, deleteNote as deleteNoteMutation } from "./graphql/mutations";
import { generateClient } from 'aws-amplify/api';
import { uploadData, getUrl, remove } from 'aws-amplify/storage';

// Generate an Amplify API client
const client = generateClient();

const App = ({ signOut }) => {
  // State hook for storing notes
  const [notes, setNotes] = useState([]);

  // Fetch notes from the API on component mount
  useEffect(() => {
    fetchNotes();
  }, []);

  // Function to fetch notes, including resolving image URLs
  async function fetchNotes() {
    const apiData = await client.graphql({ query: listNotes });
    const notesFromAPI = apiData.data.listNotes.items;
    await Promise.all(notesFromAPI.map(async (note) => {
      if (note.image) {
        const url = await getUrl({ key: note.name });
        note.image = url.url;
      }
      return note;
    }));
    setNotes(notesFromAPI);
  }

// Function to handle note creation, including image upload
  async function createNote(event) {
      event.preventDefault();
      const form = new FormData(event.target);
      const image = form.get("image");
      const data = {
          name: form.get("name"),
          description: form.get("description"),
          image: image ? image.name : null,
      };
      if (data.image) {
          await uploadData({ key: data.name, data: image });
      }
      await client.graphql({ query: createNoteMutation, variables: { input: data } });
      fetchNotes();
      event.target.reset();
  }

  // Function to handle note deletion, including removing the associated image
  async function deleteNote({ id, name }) {
    const newNotes = notes.filter(note => note.id !== id);
    setNotes(newNotes);
    if (name) await remove({ key: name });
    await client.graphql({ query: deleteNoteMutation, variables: { input: { id } } });
  }

  // Render the application UI
  return (
    <View className="App">
      {/* App heading */}
      <Heading level={1} fontWeight="bold">Cloud Academy NoteKeeper</Heading>
      <Text fontWeight="normal" color="secondary" style={{ marginTop: '0.5rem', marginBottom: '1rem' }}>
      React-Based Note App with AWS Amplify's Auth, API, Storage, and UI Libraries</Text>

      {/* External link example */}
      <Link href="www.cloudacademy.com" color="#035DEB" textDecoration="underline dotted" isExternal>
        www.cloudacademy.com
      </Link>

      {/* Divider example */}
      <Flex direction="column">
         <Divider size="large" orientation="horizontal" />
      </Flex>

      {/* Note creation form */}
      <View as="form" margin="3rem 0" onSubmit={createNote}>
        <Flex direction="row" justifyContent="center">
          <TextField name="name" placeholder="Note Name" label="Note Name" labelHidden variation="quiet" required />
          <TextField name="description" placeholder="Description" label="Note Description" labelHidden variation="quiet" required />
          <View name="image" as="input" type="file" style={{ alignSelf: "end" }} />
          <Button colorTheme="overlay" type="submit"> Create Note</Button>
        </Flex>
      </View>

      {/* Display saved notes */}
      <Heading level={4}>Saved Notes</Heading>
      <View margin="3rem 0">
        {notes.map(note => (
          <Card key={note.id} variation="outlined" style={{ marginBottom: '1rem' }}>
            <Flex direction="column" gap="0.5rem" padding="1rem">
              <Text fontWeight="bold">{note.name}</Text>
              <Text>{note.description}</Text>
              {note.image && (
                <Image src={note.image} alt={`visual aid for ${notes.name}`} style={{ width: 400 }}/>
              )}
              <Button variation="link" onClick={() => deleteNote(note)}>Delete note</Button>
            </Flex>
          </Card>
        ))}
      </View>

      {/* Sign-out button */}
      <Button colorTheme="overlay" variation="primary" onClick={signOut}>Sign Out</Button>
    </View>
  );
};

// Wrap App component with Amplify authenticator
export default withAuthenticator(App);