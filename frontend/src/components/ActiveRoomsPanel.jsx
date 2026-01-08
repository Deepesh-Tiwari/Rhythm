import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { ChatBubbleLeftRightIcon, UserIcon, SignalIcon } from '@heroicons/react/24/outline';
import { PlayIcon } from '@heroicons/react/24/solid';
import { getPublicRooms } from '../services/roomService';

const ActiveRoomsPanel = () => {
	// In the future, you would fetch a list of active rooms here.

	const navigate = useNavigate();
	const [rooms, setRooms] = useState([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const fetchRooms = async () => {
			try {
				setLoading(true);
				// Default: Page 1, Limit 10
				const data = await getPublicRooms(1, 10);
				setRooms(data.rooms || []);
			} catch (error) {
				console.error("Failed to fetch active rooms:", error);
			} finally {
				setLoading(false);
			}
		};

		fetchRooms();
	}, []);

	return (
		<div className="card bg-base-200 shadow-lg h-full hidden lg:flex flex-col overflow-hidden">
			<div className="card-body p-6 flex flex-col h-full">

				{/* Header */}
				<h2 className="card-title text-xl mb-4 flex items-center gap-2">
					<SignalIcon className="h-6 w-6 text-secondary" />
					<span>Active Rooms</span>
				</h2>

				{/* List Content */}
				<div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-2">

					{loading ? (
						<div className="flex justify-center py-10">
							<span className="loading loading-spinner text-secondary"></span>
						</div>
					) : rooms.length === 0 ? (
						<div className="text-center py-10 opacity-50">
							<p>No public parties right now.</p>
							<button
								onClick={() => navigate('/create-room')}
								className="btn btn-sm btn-ghost mt-2 text-primary"
							>
								Start One?
							</button>
						</div>
					) : (
						rooms.map((room) => (
							<div
								key={room._id}
								onClick={() => navigate(`/rooms/${room.code}`)}
								className="group relative bg-base-100 hover:bg-base-300 transition-all duration-200 p-3 rounded-xl cursor-pointer border border-transparent hover:border-secondary/20 shadow-sm"
							>
								{/* Room Info */}
								<div className="flex justify-between items-start mb-2">
									<h3 className="font-bold text-sm truncate pr-2 group-hover:text-secondary transition-colors">
										{room.name}
									</h3>
									<div className="badge badge-sm badge-neutral gap-1 shrink-0">
										<UserIcon className="w-3 h-3" />
										{room.activeMemberCount}
									</div>
								</div>

								{/* Current Track Info */}
								{room.currentTrack ? (
									<div className="flex items-center gap-2 bg-base-200/50 p-2 rounded-lg">
										{room.currentTrack.image ? (
											<img
												src={room.currentTrack.image}
												alt="art"
												className="w-8 h-8 rounded object-cover"
											/>
										) : (
											<div className="w-8 h-8 bg-black/20 rounded flex items-center justify-center">
												<PlayIcon className="w-4 h-4 opacity-50" />
											</div>
										)}
										<div className="flex-1 min-w-0">
											<p className="text-xs font-medium truncate">{room.currentTrack.name}</p>
											<p className="text-[10px] opacity-60 truncate">{room.currentTrack.artist}</p>
										</div>

										{/* Equalizer Animation (Visual flair) */}
										<div className="flex gap-0.5 items-end h-3 w-4 pb-1">
											<span className="w-1 bg-secondary animate-[music-bar_1s_ease-in-out_infinite] h-2"></span>
											<span className="w-1 bg-secondary animate-[music-bar_1.2s_ease-in-out_infinite_0.1s] h-3"></span>
											<span className="w-1 bg-secondary animate-[music-bar_0.8s_ease-in-out_infinite_0.2s] h-1"></span>
										</div>
									</div>
								) : (
									<p className="text-xs opacity-40 italic py-2 pl-1">
										Waiting for music...
									</p>
								)}

								{/* Genre Tags */}
								{room.genres && room.genres.length > 0 && (
									<div className="mt-2 flex flex-wrap gap-1">
										{room.genres.slice(0, 3).map((g, i) => (
											<span key={i} className="text-[10px] bg-base-200 px-2 py-0.5 rounded-full opacity-60">
												#{g}
											</span>
										))}
									</div>
								)}
							</div>
						))
					)}
				</div>

				{/* Footer */}
				<div className="pt-4 mt-auto border-t border-base-300">
					<button
						onClick={() => navigate('/create-room')}
						className="btn btn-block btn-secondary btn-outline btn-sm"
					>
						+ Create Room
					</button>
				</div>

			</div>

			{/* Add this simple keyframe for the equalizer bars if not in global css */}
			<style>{`
        @keyframes music-bar {
            0%, 100% { height: 20%; }
            50% { height: 100%; }
        }
      `}</style>
		</div>
	);
};

export default ActiveRoomsPanel;