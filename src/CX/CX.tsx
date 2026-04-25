import { Box, Button, Container, Typography } from '@mui/material';
import { FaArrowLeft } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const CX = () => {
	const navigate = useNavigate();

	return (
		<Container sx={{ width: '100%', py: 2 }}>
			<Box sx={{ mb: { xs: 4, sm: 6 }, position: 'relative' }}>
				<Box sx={{ display: { xs: 'none', sm: 'flex' }, position: 'absolute', left: 0, top: 0 }}>
					<Button
						variant="outlined"
						startIcon={<FaArrowLeft style={{ color: '#7B68EE' }} />}
						onClick={() => navigate('/')}
						sx={{ color: 'white', borderColor: '#7B68EE' }}
					>
						Back to Homepage
					</Button>
				</Box>

				<Typography
					variant="h3"
					component="h1"
					align="center"
					sx={{
						fontWeight: 'bold',
						letterSpacing: '0.05em',
						background: 'linear-gradient(90deg, #5D80F7, #7B68EE)',
						WebkitBackgroundClip: 'text',
						WebkitTextFillColor: 'transparent',
						backgroundClip: 'text',
						textFillColor: 'transparent',
						fontSize: { xs: '2rem', sm: '3rem' },
					}}
				>
					CX Prices
				</Typography>
			</Box>

			<Box>
				<h1>Hello, World!</h1>
			</Box>
		</Container>
	);
};

export default CX;
