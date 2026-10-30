interface Props {
    /** The app's name, as it reads in the message: "A new version of {appName} is available". */
    appName: string;
    /** Force it shown (true) or hidden (false), for demos and tests. Unset = follow SvelteKit. */
    show?: boolean;
}
declare const UpdateBanner: import("svelte").Component<Props, {}, "">;
type UpdateBanner = ReturnType<typeof UpdateBanner>;
export default UpdateBanner;
