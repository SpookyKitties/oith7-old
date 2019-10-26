import {
  NoteTypes,
  NoteCategories,
} from '../verse-notes/settings/note-gorup-settings';
import { of, forkJoin } from 'rxjs';
import { flatMap$ } from '../main';
import { flatMap, map, find, toArray, filter } from 'rxjs/operators';
import Note, { NoteRef, VerseNote } from '../verse-notes/verse-note';

function parseVerseNoteElementID($: CheerioStatic, element: CheerioElement) {
  if (element.attribs['id'] === '') {
    console.log('throw 1');
    throw element.data;
  }
  return of($(element).attr('id'));
}

function parseNoteType(
  $: CheerioStatic,
  noteElement: CheerioElement,
  noteTypes: NoteTypes,
) {
  // console.log(
  // noteTypes.noteTypes.find(o => o.className === $(noteElement).attr('class')),
  // );
  return of(noteTypes.noteTypes).pipe(
    flatMap$,
    find(o => o.className === $(noteElement).attr('class')),
    map(o => (o ? o.noteType : -1)),
  );
}

function parseNoteCategory(
  $: CheerioStatic,
  noteRefLabel: Cheerio,
  noteCategories: NoteCategories,
) {
  const nc = noteCategories.noteCategories.find(
    n => n.className === $(noteRefLabel).attr('class'),
  );
  if (nc) {
    $(noteRefLabel).remove();
    // noteRefLabel.parent.;
    return of(nc.noteCategory);
  }
  // console.log(not);

  console.log(`Not valid ${$(noteRefLabel).attr('class')} `);
  return of(-1);
  // throw noteRefLabel.innerHTML;
}
function parseNoteRef(
  $: CheerioStatic,
  noteRefElement: CheerioElement,
  noteCategories: NoteCategories,
) {
  const refLabelElement = $('[class*="reference-label"]', noteRefElement);
  if (refLabelElement) {
    return parseNoteCategory($, refLabelElement.first(), noteCategories).pipe(
      map(
        (noteCategory): NoteRef => {
          return new NoteRef(noteCategory, $(noteRefElement).html() as string);
        },
      ),
    );
  }
  console.log('throw 3');
  throw noteRefElement.data;
}

function parseNotePhrase($: CheerioStatic, noteE: CheerioElement) {
  const notePhraseElement = $('.note-phrase', noteE);

  if (notePhraseElement) {
    return of($(notePhraseElement).html() as string);
  }

  console.log('throw 4');
  throw noteE.attribs['id'];
}

function parseNoteMap(
  $: CheerioStatic,
  noteElement: CheerioElement,
  noteTypes: NoteTypes,
  noteCategories: NoteCategories,
) {
  return forkJoin(
    parseNotePhrase($, noteElement),
    parseNoteType($, noteElement, noteTypes),
    of($('.note-reference', noteElement)).pipe(
      flatMap(o => o),
      map(nre => {
        return parseNoteRef($, nre, noteCategories);
      }),
      flatMap$,
      toArray(),
    ),
  ).pipe(
    map(([notePhrase, noteType, noteRefts]) => {
      return new Note(
        noteElement.attribs['id'],
        noteRefts,
        noteType,
        notePhrase,
      );
    }),
  );
}

function parseNotes(
  $: CheerioStatic,
  verseNoteElement: CheerioElement,
  noteTypes: NoteTypes,
  noteCategories: NoteCategories,
) {
  return of($('note', verseNoteElement).toArray()).pipe(
    flatMap(o => o),
    map(o => parseNoteMap($, o, noteTypes, noteCategories)),
    flatMap$,
    toArray(),
  );
}

function parseVerseNote(
  $: CheerioStatic,

  verseNoteElement: CheerioElement,
  noteTypes: NoteTypes,
  noteCategories: NoteCategories,
) {
  return forkJoin(
    parseVerseNoteElementID($, verseNoteElement),
    parseNotes($, verseNoteElement, noteTypes, noteCategories).pipe(
      filter(o => o.length > 0),
    ),
  ).pipe(
    map(([id, notes]) => {
      return new VerseNote(id, notes);
    }),
  );
}
export function verseNoteProcessor(
  document: CheerioStatic,
  noteTypes: NoteTypes,
  noteCategories: NoteCategories,
) {
  document;
  noteTypes;
  noteCategories;
  return of(document('verse-notes').toArray()).pipe(
    flatMap(o => o),
    map(verseNoteElement => {
      return parseVerseNote(
        document,
        verseNoteElement,
        noteTypes,
        noteCategories,
      );
    }),
    flatMap$,
  );
}
