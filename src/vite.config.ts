import { SearchPlugin } from "vitepress-plugin-search";
import { defineConfig } from "vite";

//default options
const options = {
    previewLength: 64,
    buttonLabel: "Search",
    placeholder: "Search docs",


};

export default defineConfig({
  plugins: [SearchPlugin(options)],
});
