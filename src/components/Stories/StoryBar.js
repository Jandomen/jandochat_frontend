import React, { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { getStoriesFeed } from "../../api/stories";
import useAuth from "../../hooks/useAuth";
import StoryViewer from "./StoryViewer";
import StoryEditor from "./StoryEditor";

export default function StoryBar() {
    const [storyGroups, setStoryGroups] = useState([]);
    const [viewerOpen, setViewerOpen] = useState(false);
    const [editorOpen, setEditorOpen] = useState(false);
    const [selectedGroupIdx, setSelectedGroupIdx] = useState(0);
    const { user } = useAuth();

    const fetchStories = async () => {
        try {
            const data = await getStoriesFeed();
            setStoryGroups(data);
        } catch (err) {
            console.error("Error loading stories:", err);
        }
    };

    useEffect(() => {
        fetchStories();
    }, []);

    const openViewer = (idx) => {
        setSelectedGroupIdx(idx);
        setViewerOpen(true);
    };

    const handleStoryPublished = () => {
        setEditorOpen(false);
        fetchStories();
    };

    return (
        <>
            <div className="mb-6">
                <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide px-1">
                    {/* Add Story Button */}
                    <button
                        onClick={() => setEditorOpen(true)}
                        className="flex flex-col items-center gap-2 flex-shrink-0 group"
                    >
                        <div className="relative w-[72px] h-[72px]">
                            <div className="w-full h-full rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center shadow-lg shadow-red-200 group-hover:scale-110 transition-transform">
                                {user?.fotoPerfil ? (
                                    <img
                                        src={user.fotoPerfil}
                                        alt=""
                                        className="w-[64px] h-[64px] rounded-full object-cover border-3 border-white"
                                    />
                                ) : (
                                    <div className="w-[64px] h-[64px] rounded-full bg-gray-200 border-3 border-white" />
                                )}
                            </div>
                            <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-red-600 rounded-full flex items-center justify-center border-3 border-white shadow-md">
                                <Plus className="w-4 h-4 text-white" strokeWidth={3} />
                            </div>
                        </div>
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider w-[72px] text-center truncate">
                            Tu historia
                        </span>
                    </button>

                    {/* Story Avatars */}
                    {storyGroups.map((group, idx) => {
                        if (group.usuario._id === user?._id && group.stories.length === 0) return null;
                        return (
                            <button
                                key={group.usuario._id}
                                onClick={() => openViewer(idx)}
                                className="flex flex-col items-center gap-2 flex-shrink-0 group"
                            >
                                <div className="relative w-[72px] h-[72px]">
                                    <div
                                        className={`w-full h-full rounded-full p-[3px] transition-transform group-hover:scale-110 ${group.hasNew
                                                ? "bg-gradient-to-tr from-red-500 via-red-600 to-orange-500 animate-pulse"
                                                : "bg-gray-300"
                                            }`}
                                    >
                                        <img
                                            src={group.usuario.fotoPerfil || "/assets/Custom-Icon-Design-Pretty-Office-8-User-red.256.png"}
                                            alt=""
                                            className="w-full h-full rounded-full object-cover border-3 border-white"
                                        />
                                    </div>
                                    {group.stories.length > 1 && (
                                        <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-red-600 rounded-full flex items-center justify-center text-[9px] font-black text-white border-2 border-white">
                                            {group.stories.length}
                                        </div>
                                    )}
                                </div>
                                <span className="text-[10px] font-bold text-gray-500 w-[72px] text-center truncate">
                                    {group.usuario._id === user?._id ? "Tú" : group.usuario.nombre?.split(" ")[0]}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Story Viewer Modal */}
            {viewerOpen && storyGroups.length > 0 && (
                <StoryViewer
                    storyGroups={storyGroups}
                    initialGroupIndex={selectedGroupIdx}
                    onClose={() => setViewerOpen(false)}
                />
            )}

            {/* Story Editor Modal */}
            {editorOpen && (
                <StoryEditor
                    onClose={() => setEditorOpen(false)}
                    onPublished={handleStoryPublished}
                />
            )}
        </>
    );
}
