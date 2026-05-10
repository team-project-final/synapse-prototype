import { BrowserRouter, Routes, Route } from 'react-router';
import Landing from './routes/landing';
import About from './routes/about';
import Architecture from './routes/architecture';
import DocsIndex from './routes/docs/index';
import DocsSlug from './routes/docs/Slug';
import TechHub from './routes/tech/index';
import TechSlug from './routes/tech/Slug';
import AppLayout from './routes/app/Layout';
import Dashboard from './routes/app/Dashboard';
import NotesList from './routes/app/notes/List';
import NoteNew from './routes/app/notes/New';
import NoteView from './routes/app/notes/View';
import NoteEdit from './routes/app/notes/Edit';
import DecksList from './routes/app/decks/List';
import DeckReview from './routes/app/decks/Review';
import DeckResult from './routes/app/decks/Result';
import AIGenerate from './routes/app/ai/Generate';
import Graph from './routes/app/Graph';
import Search from './routes/app/Search';
import Profile from './routes/app/Profile';
import Groups from './routes/app/Groups';
import GroupDetail from './routes/app/groups/Detail';
import { Toaster } from './components/ds';
import { SeedGuard } from './components/SeedGuard';

export default function App() {
  return (
    <SeedGuard>
    <BrowserRouter basename="/synapse-prototype">
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/about" element={<About />} />
        <Route path="/architecture" element={<Architecture />} />
        <Route path="/tech" element={<TechHub />} />
        <Route path="/tech/:slug" element={<TechSlug />} />
        <Route path="/docs" element={<DocsIndex />} />
        <Route path="/docs/:slug" element={<DocsSlug />} />
        <Route path="/docs/:slug/:sub" element={<DocsSlug />} />
        <Route path="/app" element={<AppLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="notes" element={<NotesList />} />
          <Route path="notes/new" element={<NoteNew />} />
          <Route path="notes/:id" element={<NoteView />} />
          <Route path="notes/:id/edit" element={<NoteEdit />} />
          <Route path="decks" element={<DecksList />} />
          <Route path="decks/:id/review" element={<DeckReview />} />
          <Route path="decks/:id/review/result" element={<DeckResult />} />
          <Route path="ai/generate" element={<AIGenerate />} />
          <Route path="graph" element={<Graph />} />
          <Route path="search" element={<Search />} />
          <Route path="profile" element={<Profile />} />
          <Route path="groups" element={<Groups />} />
          <Route path="groups/:id" element={<GroupDetail />} />
        </Route>
      </Routes>
      <Toaster />
    </BrowserRouter>
    </SeedGuard>
  );
}
