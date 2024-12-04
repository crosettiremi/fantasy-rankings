export default {
	async fetch(request) {
	  const url = new URL(request.url);
  
	  // Your ESPN Fantasy League credentials
	  const LEAGUE_ID = "210875"; // Replace with your league ID
	  const SEASON_YEAR = "2024"; // Replace with the current season year
	  const ESPN_S2 = "AEAR7yOPbxjnKrPdqLyo%2FZsg%2BSNteJHcxsyYXYiAij9khRXDfpb%2FaYlRvjwPJEnAKoqRkFOwAebjRCVoUY6c%2B3X4a6sqU07i5GB1mcUrW5KcPmi07Mu9eitLI%2FPQMm1HjihYQbv30WNx%2BfKBx7lelOmV4DDkV9DqbLN6u3yxcv94YiReB2Vmcz9eb%2BgJhCISoDlEcTSsLZYormNQCKdzcLk3xVjC3lR39nec2YltOZn68OPIT2ddYJ%2BbVKgH4DRg1cJ%2FN3E62xlV8K7G682ixn9ZJvYUgWZjAG3NWcqXQM2Kgg%3D%3D"; // Replace with your espn_s2 cookie
	  const SWID = "{8C7ED4D4-8C3A-46AE-BED4-D48C3AD6AE5F}"; // Replace with your SWID cookie
	  const BASE_URL = `https://lm-api-reads.fantasy.espn.com/apis/v3/games/fba/seasons/2025/segments/0/leagues/${LEAGUE_ID}`;

	  const fetchESPNData = async (endpoint) => {
		const response = await fetch(endpoint, {
		  headers: {
			Cookie: `espn_s2=${ESPN_S2}; SWID=${SWID}`,
		  },
		});
  
		if (!response.ok) {
		  throw new Error(`Failed to fetch data: ${response.status} ${response.statusText}`);
		}
  
		return response.json();
	  };
  
	  if (url.pathname === "/rosters") {
		try {
		  const data = await fetchESPNData(`${BASE_URL}?view=mRoster&view=mTeam`);
  
		  // Map for human-readable positions
		  const positionMap = {
			1: "PG",
			2: "SG",
			3: "SF",
			4: "PF",
			5: "C",
		  };
  
		  // Extract team names and map to IDs
		  const teamNameMap = {};
		  data.teams.forEach((team) => {
			teamNameMap[team.id] = {
			  name: team.name || `Team ${team.id}`,
			  logo: team.logo || "No Logo",
			  isActive: team.isActive || false,
			};
		  });
  
		  // Build rosters
		  const rosters = data.teams.map((team) => {
			const teamName = teamNameMap[team.id].name;
			const players = team.roster.entries.map((entry) => {
			  const player = entry.playerPoolEntry.player;
  
			  // Extract stats (e.g., points, assists, rebounds)
			  const stats = player.stats
				? player.stats.reduce((acc, stat) => {
					if (stat.statSourceId === 0 && stat.statSplitTypeId === 0) {
					  return { ...acc, ...stat.appliedStats };
					}
					return acc;
				  }, {})
				: {};
  
			  return {
				fullName: player.fullName,
				position: positionMap[player.defaultPositionId] || "Unknown",
				stats, // Add stats to the player object
			  };
			});
  
			return {
			  teamName,
			  teamId: team.id,
			  logo: teamNameMap[team.id].logo,
			  players,
			};
		  });
  
		  // Apply filters
		  const params = new URLSearchParams(url.search);
		  const teamId = params.get("teamId");
		  const teamName = params.get("teamName");
  
		  let filteredRosters = rosters;
		  if (teamId) {
			filteredRosters = filteredRosters.filter((roster) => roster.teamId.toString() === teamId);
		  }
		  if (teamName) {
			filteredRosters = filteredRosters.filter((roster) =>
			  roster.teamName.toLowerCase().includes(teamName.toLowerCase())
			);
		  }
  
		  return new Response(JSON.stringify(filteredRosters, null, 2), {
			headers: { "Content-Type": "application/json" },
		  });
		} catch (error) {
		  return new Response(`Error fetching team rosters: ${error.message}`, { status: 500 });
		}
	  }
  
	  return new Response("Not Found", { status: 404 });
	},
  };