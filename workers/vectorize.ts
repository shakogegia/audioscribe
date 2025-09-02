import "dotenv/config";
import { program } from "commander";
import fs from "fs";
import path from "path";
import os from "os";
import axios from "axios";

program.requiredOption("-b, --book-id <string>", "The ID of the book").parse(process.argv);

program.parse();

const { transcript, bookId } = program.opts();

async function setupNewBook(bookId: string) {
  console.log("Setting up audiobook:", bookId);
}

setupNewBook(bookId);
